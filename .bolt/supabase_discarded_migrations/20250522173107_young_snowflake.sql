-- Drop existing policies with proper error handling
DO $$ 
BEGIN
  -- Explicitly drop all potentially conflicting policies with IF EXISTS
  DROP POLICY IF EXISTS "Users can manage their own invitations" ON partner_invitations;
  DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON partner_invitations;
  
  DROP POLICY IF EXISTS "Users can view relationships they're part of" ON relationships;
  DROP POLICY IF EXISTS "Users can create relationships they're part of" ON relationships;
  DROP POLICY IF EXISTS "Users can update relationships they're part of" ON relationships;
  
  DROP POLICY IF EXISTS "Users can view compatibility scores for their relationships" ON compatibility_scores;
  DROP POLICY IF EXISTS "Users can create compatibility scores for their relationships" ON compatibility_scores;
  
EXCEPTION
  WHEN undefined_table THEN
    -- Tables don't exist yet, that's fine
    NULL;
  WHEN undefined_object THEN
    -- Policies don't exist, that's fine
    NULL;
END $$;

-- Now recreate the policies safely
DO $$ 
BEGIN
  -- Recreate the policies for partner_invitations if the table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'partner_invitations') THEN
    CREATE POLICY "Users can manage their own invitations"
      ON partner_invitations
      FOR ALL
      TO authenticated
      USING (auth.uid() = sender_id);
      
    CREATE POLICY "Users can view invitations sent to their email"
      ON partner_invitations
      FOR SELECT
      TO authenticated
      USING (
        email = (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
      );
  END IF;
  
  -- Recreate the policies for relationships if the table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'relationships') THEN
    CREATE POLICY "Users can view relationships they're part of"
      ON relationships
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user1_id OR auth.uid() = user2_id);
      
    CREATE POLICY "Users can create relationships they're part of"
      ON relationships
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
      
    CREATE POLICY "Users can update relationships they're part of"
      ON relationships
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user1_id OR auth.uid() = user2_id);
  END IF;
  
  -- Recreate the policies for compatibility_scores if the table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'compatibility_scores') THEN
    CREATE POLICY "Users can view compatibility scores for their relationships"
      ON compatibility_scores
      FOR SELECT
      TO authenticated
      USING (
        relationship_id IN (
          SELECT id FROM relationships 
          WHERE user1_id = auth.uid() OR user2_id = auth.uid()
        )
      );
      
    CREATE POLICY "Users can create compatibility scores for their relationships"
      ON compatibility_scores
      FOR INSERT
      TO authenticated
      WITH CHECK (
        relationship_id IN (
          SELECT id FROM relationships 
          WHERE user1_id = auth.uid() OR user2_id = auth.uid()
        )
      );
  END IF;
END $$;