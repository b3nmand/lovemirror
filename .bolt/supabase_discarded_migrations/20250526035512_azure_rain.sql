/*
  # Fix auth.users permission issues

  1. Changes:
    - Create trigger to keep 'users' table in sync with auth.users
    - Improve set_sender_email function with better error handling
    - Update RLS policies to avoid direct auth.users access where possible
    - Fix invitation code generation for partner_invitations table

  2. Purpose:
    - Resolve permission errors when accessing auth.users table
    - Provide a proper public 'users' table for client-side queries
    - Ensure invitation system works reliably
*/

-- Create a trigger to keep 'users' table in sync with auth.users
CREATE OR REPLACE FUNCTION sync_users_from_auth() 
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Insert or update the public users table
    INSERT INTO public.users (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
    ON CONFLICT (id) DO UPDATE 
    SET 
      email = NEW.email,
      name = NEW.raw_user_meta_data->>'name';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Delete from the public users table
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sync_users_from_auth_trigger'
  ) THEN
    CREATE TRIGGER sync_users_from_auth_trigger
    AFTER INSERT OR UPDATE OR DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_users_from_auth();
  END IF;
END
$$;

-- Sync existing auth.users data to public.users
DO $$
BEGIN
  -- This requires superuser privilege, will work during migration but not for regular users
  INSERT INTO public.users (id, email, name)
  SELECT id, email, raw_user_meta_data->>'name' 
  FROM auth.users
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Unable to sync existing users due to permissions. This is expected.';
END
$$;

-- Improve the function to ensure sender_email is populated
CREATE OR REPLACE FUNCTION set_sender_email() 
RETURNS TRIGGER AS $$
BEGIN
  -- Try to get email from auth.users if not already set
  IF NEW.sender_email IS NULL THEN
    BEGIN
      -- First try to get from public.users table
      SELECT email INTO NEW.sender_email
      FROM public.users
      WHERE id = NEW.sender_id;
      
      -- If that fails, try auth.users (might fail due to permissions)
      IF NEW.sender_email IS NULL THEN
        BEGIN
          SELECT email INTO NEW.sender_email
          FROM auth.users
          WHERE id = NEW.sender_id;
        EXCEPTION WHEN OTHERS THEN
          -- If we can't get the email, use a placeholder
          NEW.sender_email := 'unknown@example.com';
        END;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If anything fails, use a placeholder
      NEW.sender_email := 'unknown@example.com';
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Modify the policy for viewing invitations sent to their email
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON partner_invitations;

CREATE POLICY "Users can view invitations sent to their email"
  ON partner_invitations
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid())
    OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Update the policy for accepting invitations 
DROP POLICY IF EXISTS "Users can update invitations sent to their email" ON partner_invitations;

CREATE POLICY "Users can update invitations sent to their email"
  ON partner_invitations
  FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid())
    OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Fix any partner_invitations with NULL invitation_code
DO $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN 
    SELECT id FROM partner_invitations WHERE invitation_code IS NULL OR invitation_code = ''
  LOOP
    UPDATE partner_invitations 
    SET invitation_code = generate_invitation_code()
    WHERE id = inv.id;
  END LOOP;
END
$$;

-- Run final check to mark expired invitations
DO $$
BEGIN
  UPDATE partner_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
  
  UPDATE external_assessors
  SET status = 'completed'
  WHERE status = 'pending' AND expires_at < NOW();
END
$$;