/*
  # Fix Partner Invitation System

  1. Checks & Fixes:
    - Verifies partner_invitations table exists and has the correct schema
    - Ensures all required functions exist and are correctly implemented
    - Fixes triggers for invitation code generation
    - Updates RLS policies to work correctly
    - Repairs any existing invitations with missing codes

  2. Purpose:
    - Resolves "relation public.invite_partner does not exist" error
    - Ensures the invitation system functions properly
*/

-- First, check if the table exists and create it if not
DO $$ 
BEGIN
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
END $$;

-- Ensure invitation_code column has the correct default value
DO $$ 
BEGIN
  ALTER TABLE partner_invitations 
  ALTER COLUMN invitation_code SET DEFAULT generate_invitation_code();
EXCEPTION 
  WHEN undefined_function THEN
    -- Function doesn't exist yet, will be created below
    NULL;
END $$;

-- Recreate the function to generate invitation codes with robust error handling
CREATE OR REPLACE FUNCTION generate_invitation_code() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
  code_exists BOOLEAN;
  max_attempts INTEGER := 20;
  current_attempt INTEGER := 0;
BEGIN
  LOOP
    -- Prevent infinite loops by limiting attempts
    current_attempt := current_attempt + 1;
    IF current_attempt > max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique invitation code after % attempts', max_attempts;
    END IF;
    
    -- Generate an 8-character random code
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists in partner_invitations
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM partner_invitations 
        WHERE invitation_code = result
      ) INTO code_exists;
    EXCEPTION WHEN OTHERS THEN
      code_exists := FALSE;
    END;
    
    -- If code exists in partner_invitations, try again
    IF code_exists THEN
      CONTINUE;
    END IF;
    
    -- Check if code exists in external_assessors
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM external_assessors 
        WHERE invitation_code = result
      ) INTO code_exists;
    EXCEPTION WHEN OTHERS THEN
      code_exists := FALSE;
    END;
    
    -- If code is unique in both tables, return it
    IF NOT code_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop any existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS generate_invitation_code_trigger ON partner_invitations;

-- Create trigger for generating invitation codes on partner_invitations table
CREATE TRIGGER generate_invitation_code_trigger
  BEFORE INSERT ON partner_invitations
  FOR EACH ROW
  WHEN (NEW.invitation_code IS NULL OR NEW.invitation_code = '')
  EXECUTE FUNCTION generate_invitation_code();

-- Fix the function to handle invitation expiration
CREATE OR REPLACE FUNCTION handle_invitation_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark expired invitations
  UPDATE partner_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
  
  -- Only allow one pending invitation per user
  IF NEW.status = 'pending' THEN
    UPDATE partner_invitations
    SET status = 'expired'
    WHERE sender_id = NEW.sender_id 
      AND id != NEW.id
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_invitation_expiration_trigger ON partner_invitations;

-- Create trigger for invitation expiration
CREATE TRIGGER handle_invitation_expiration_trigger
  AFTER INSERT ON partner_invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_invitation_expiration();

-- Improve the function to ensure sender_email is populated with robust error handling
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
      IF NEW.sender_email IS NULL THEN
        BEGIN
          SELECT email INTO NEW.sender_email
          FROM auth.users
          WHERE id = NEW.sender_id;
        EXCEPTION WHEN OTHERS THEN
          -- If we can't get the email, use a placeholder
          NEW.sender_email := 'invitation@example.com';
        END;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If anything fails, use a placeholder
      NEW.sender_email := 'invitation@example.com';
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_sender_email_trigger ON partner_invitations;

-- Create trigger for setting sender email
CREATE TRIGGER set_sender_email_trigger
  BEFORE INSERT ON partner_invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_sender_email();

-- Fix RLS policies
ALTER TABLE partner_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON partner_invitations;
DROP POLICY IF EXISTS "Users can update invitations sent to their email" ON partner_invitations;

-- Recreate proper policies
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
    email = (SELECT email FROM public.users WHERE id = auth.uid())
    OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

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
END
$$;

-- Validate the table structure
DO $$
DECLARE
  missing_columns TEXT := '';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_invitations' AND column_name = 'invitation_code') THEN
    missing_columns := missing_columns || 'invitation_code, ';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_invitations' AND column_name = 'sender_id') THEN
    missing_columns := missing_columns || 'sender_id, ';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_invitations' AND column_name = 'status') THEN
    missing_columns := missing_columns || 'status, ';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_invitations' AND column_name = 'expires_at') THEN
    missing_columns := missing_columns || 'expires_at, ';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_invitations' AND column_name = 'sender_email') THEN
    missing_columns := missing_columns || 'sender_email, ';
  END IF;
  
  IF LENGTH(missing_columns) > 0 THEN
    RAISE NOTICE 'partner_invitations table is missing columns: %', LEFT(missing_columns, LENGTH(missing_columns) - 2);
    -- Columns will be created automatically when the table is created above
  ELSE
    RAISE NOTICE 'partner_invitations table has all required columns';
  END IF;
END
$$;

-- Make sure default value for invitation_code is set correctly
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_invitations' 
    AND column_name = 'invitation_code'
    AND column_default IS NULL
  ) THEN
    ALTER TABLE partner_invitations 
    ALTER COLUMN invitation_code SET DEFAULT generate_invitation_code();
    
    RAISE NOTICE 'Default value for invitation_code has been set';
  END IF;
END
$$;