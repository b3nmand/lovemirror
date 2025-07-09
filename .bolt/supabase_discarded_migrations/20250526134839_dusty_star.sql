-- Fix issues with invitation systems

-- 1. First verify tables exist and create them if needed
DO $$ 
BEGIN
  -- Create partner_invitations table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'partner_invitations'
  ) THEN
    CREATE TABLE partner_invitations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id uuid REFERENCES auth.users NOT NULL,
      invitation_code text UNIQUE NOT NULL,
      email text,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz DEFAULT now(),
      expires_at timestamptz NOT NULL,
      updated_at timestamptz DEFAULT now(),
      sender_email text,

      CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
    );

    -- Create indexes for faster invitation lookups
    CREATE INDEX partner_invitations_sender_id_idx ON partner_invitations(sender_id);
    CREATE INDEX partner_invitations_status_idx ON partner_invitations(status);
  END IF;

  -- Create external_assessors table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'external_assessors'
  ) THEN
    CREATE TABLE external_assessors (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users NOT NULL,
      email text NOT NULL,
      relationship text NOT NULL,
      invitation_code text UNIQUE NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz DEFAULT now(),
      expires_at timestamptz NOT NULL,
      updated_at timestamptz DEFAULT now(),
      assessment_type text,
      
      CONSTRAINT valid_status CHECK (status IN ('pending', 'completed')),
      CONSTRAINT valid_assessment_type CHECK (assessment_type IS NULL OR assessment_type IN ('high-value-man', 'wife-material', 'bridal-price'))
    );

    -- Create indexes for faster lookups
    CREATE INDEX external_assessors_user_id_idx ON external_assessors(user_id);
    CREATE INDEX external_assessors_invitation_code_idx ON external_assessors(invitation_code);
    CREATE INDEX external_assessors_status_idx ON external_assessors(status);
  END IF;
END $$;

-- 2. Update functions with max retry attempts and better error handling
CREATE OR REPLACE FUNCTION generate_invitation_code() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
  code_exists BOOLEAN;
  max_attempts INTEGER := 20; -- Increase max attempts to reduce chances of failure
  current_attempt INTEGER := 0;
BEGIN
  LOOP
    -- Prevent infinite loops by limiting attempts
    current_attempt := current_attempt + 1;
    IF current_attempt > max_attempts THEN
      -- Log the error for debugging
      RAISE WARNING 'Failed to generate unique invitation code after % attempts', max_attempts;
      -- Fall back to a timestamp-based code as last resort
      result := 'INV' || to_char(now(), 'YYYYMMDDHH24MISS');
      RETURN result;
    END IF;
    
    -- Generate a 10-character random code (increased from 8 for more uniqueness)
    result := '';
    FOR i IN 1..10 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists in partner_invitations with error handling
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM partner_invitations 
        WHERE invitation_code = result
      ) INTO code_exists;
    EXCEPTION WHEN OTHERS THEN
      -- On error, assume code doesn't exist in this table
      code_exists := FALSE;
      RAISE NOTICE 'Error checking partner_invitations table: %', SQLERRM;
    END;
    
    -- If code exists in partner_invitations, try again
    IF code_exists THEN
      CONTINUE;
    END IF;
    
    -- Check if code exists in external_assessors with error handling
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM external_assessors 
        WHERE invitation_code = result
      ) INTO code_exists;
    EXCEPTION WHEN OTHERS THEN
      -- On error, assume code doesn't exist in this table
      code_exists := FALSE;
      RAISE NOTICE 'Error checking external_assessors table: %', SQLERRM;
    END;
    
    -- If code is unique in both tables, return it
    IF NOT code_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Improved function to handle invitation expiration
CREATE OR REPLACE FUNCTION handle_invitation_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to mark expired invitations
  BEGIN
    UPDATE partner_invitations
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating expired invitations: %', SQLERRM;
  END;
  
  -- Only allow one pending invitation per user with error handling
  IF NEW.status = 'pending' THEN
    BEGIN
      UPDATE partner_invitations
      SET status = 'expired'
      WHERE sender_id = NEW.sender_id 
        AND id != NEW.id
        AND status = 'pending';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error expiring old invitations: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Enhanced sender_email function
CREATE OR REPLACE FUNCTION set_sender_email() 
RETURNS TRIGGER AS $$
BEGIN
  -- Try to get email from multiple sources if not already set
  IF NEW.sender_email IS NULL THEN
    BEGIN
      -- First try to get from public.users table
      SELECT email INTO NEW.sender_email
      FROM public.users
      WHERE id = NEW.sender_id;
      
      -- If that fails, try auth.users (might fail due to permissions)
      IF NEW.sender_email IS NULL OR NEW.sender_email = '' THEN
        BEGIN
          SELECT email INTO NEW.sender_email
          FROM auth.users
          WHERE id = NEW.sender_id;
        EXCEPTION WHEN OTHERS THEN
          -- If we can't get the email, use a placeholder with error info
          RAISE NOTICE 'Could not access auth.users: %', SQLERRM;
          NEW.sender_email := 'invitation@lovemirror.app';
        END;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If anything fails, use a placeholder
      RAISE NOTICE 'Error in set_sender_email: %', SQLERRM;
      NEW.sender_email := 'invitation@lovemirror.app';
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Improve the assessor expiration function
CREATE OR REPLACE FUNCTION handle_assessor_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to mark expired assessor invitations
  BEGIN
    UPDATE external_assessors
    SET status = 'completed'
    WHERE status = 'pending' AND expires_at < NOW();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating expired assessor invitations: %', SQLERRM;
  END;
  
  -- Only allow one pending invitation per user-email-assessmenttype combination
  IF NEW.status = 'pending' THEN
    BEGIN
      UPDATE external_assessors
      SET status = 'completed'
      WHERE user_id = NEW.user_id
        AND email = NEW.email
        AND id != NEW.id
        AND status = 'pending'
        AND (assessment_type = NEW.assessment_type OR NEW.assessment_type IS NULL);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error expiring old assessor invitations: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Ensure the triggers are properly set up
-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS generate_invitation_code_trigger ON partner_invitations;
DROP TRIGGER IF EXISTS handle_invitation_expiration_trigger ON partner_invitations;
DROP TRIGGER IF EXISTS set_sender_email_trigger ON partner_invitations;
DROP TRIGGER IF EXISTS handle_assessor_expiration_trigger ON external_assessors;
DROP TRIGGER IF EXISTS generate_assessor_invitation_code_trigger ON external_assessors;

-- Recreate the triggers
-- Partner invitation triggers
CREATE TRIGGER generate_invitation_code_trigger
  BEFORE INSERT ON partner_invitations
  FOR EACH ROW
  WHEN (NEW.invitation_code IS NULL OR NEW.invitation_code = '')
  EXECUTE FUNCTION generate_invitation_code();

CREATE TRIGGER handle_invitation_expiration_trigger
  AFTER INSERT ON partner_invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_invitation_expiration();

CREATE TRIGGER set_sender_email_trigger
  BEFORE INSERT ON partner_invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_sender_email();

-- External assessor triggers
CREATE TRIGGER handle_assessor_expiration_trigger
  AFTER INSERT ON external_assessors
  FOR EACH ROW
  EXECUTE FUNCTION handle_assessor_expiration();

-- 7. Run final cleanup tasks
-- Ensure all invitation_codes are populated
DO $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN 
    SELECT id FROM partner_invitations WHERE invitation_code IS NULL OR invitation_code = ''
  LOOP
    BEGIN
      UPDATE partner_invitations 
      SET invitation_code = generate_invitation_code()
      WHERE id = inv.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error updating invitation_code for id %: %', inv.id, SQLERRM;
    END;
  END LOOP;
END
$$;

-- Mark expired invitations
DO $$
BEGIN
  -- Update partner invitations
  UPDATE partner_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
  
  -- Update external assessor invitations
  UPDATE external_assessors
  SET status = 'completed'
  WHERE status = 'pending' AND expires_at < NOW();
END
$$;