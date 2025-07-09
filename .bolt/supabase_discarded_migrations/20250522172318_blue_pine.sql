/*
  # Fix policy conflict

  This migration:
  1. Checks for duplicate policies and drops them if they exist
  2. Ensures all tables and policies are created only if they don't already exist
*/

-- Check if partner_invitations table exists and the policy exists
DO $$ 
BEGIN
  -- Drop the conflicting policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'partner_invitations' 
    AND policyname = 'Users can manage their own invitations'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage their own invitations" ON partner_invitations;
  END IF;
  
  -- Check for duplicate policies on relationships table
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'relationships' 
    AND policyname = 'Users can view relationships they''re part of'
  ) THEN
    DROP POLICY IF EXISTS "Users can view relationships they're part of" ON relationships;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'relationships' 
    AND policyname = 'Users can create relationships they''re part of'
  ) THEN
    DROP POLICY IF EXISTS "Users can create relationships they're part of" ON relationships;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'relationships' 
    AND policyname = 'Users can update relationships they''re part of'
  ) THEN
    DROP POLICY IF EXISTS "Users can update relationships they're part of" ON relationships;
  END IF;
  
  -- Check for duplicate policies on compatibility_scores table
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'compatibility_scores' 
    AND policyname = 'Users can view compatibility scores for their relationships'
  ) THEN
    DROP POLICY IF EXISTS "Users can view compatibility scores for their relationships" ON compatibility_scores;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'compatibility_scores' 
    AND policyname = 'Users can create compatibility scores for their relationships'
  ) THEN
    DROP POLICY IF EXISTS "Users can create compatibility scores for their relationships" ON compatibility_scores;
  END IF;
END $$;

-- Now recreate the policies safely
DO $$ 
BEGIN
  -- Recreate the policies for partner_invitations
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
  
  -- Recreate the policies for relationships
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
  
  -- Recreate the policies for compatibility_scores
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