/*
  # Fix Partner Invitation Code Generation

  1. Changes
    - Improve the invitation code generation function to check both tables
    - Ensure invitation code is properly set as DEFAULT
    - Fix handling of invitation expiration
    - Ensure sender_email is properly populated
    - Add improved error handling

  2. Purpose
    - Fix the partner invitation system to ensure codes are always generated
    - Prevent duplicate codes between partner and assessor invitations
    - Improve the reliability of the invitation system
*/

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS generate_invitation_code_trigger ON partner_invitations;

-- Recreate the function to generate invitation codes with improved error handling
CREATE OR REPLACE FUNCTION generate_invitation_code() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
  code_exists BOOLEAN;
  max_attempts INTEGER := 10;
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
    SELECT EXISTS(
      SELECT 1 FROM partner_invitations 
      WHERE invitation_code = result
    ) INTO code_exists;
    
    -- If code exists in partner_invitations, try again
    IF code_exists THEN
      CONTINUE;
    END IF;
    
    -- Check if code exists in external_assessors
    SELECT EXISTS(
      SELECT 1 FROM external_assessors 
      WHERE invitation_code = result
    ) INTO code_exists;
    
    -- If code is unique in both tables, return it
    IF NOT code_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for generating invitation codes on partner_invitations table
CREATE TRIGGER generate_invitation_code_trigger
  BEFORE INSERT ON partner_invitations
  FOR EACH ROW
  WHEN (NEW.invitation_code IS NULL OR NEW.invitation_code = '')
  EXECUTE FUNCTION generate_invitation_code();

-- Ensure that the invitation_code column has DEFAULT value
ALTER TABLE partner_invitations 
ALTER COLUMN invitation_code SET DEFAULT generate_invitation_code();

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

-- Fix the sender_email function to handle null values properly
CREATE OR REPLACE FUNCTION set_sender_email() 
RETURNS TRIGGER AS $$
BEGIN
  -- Try to get email from auth.users if not already set
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Run immediate cleanup for all existing expired invitations
DO $$
BEGIN
  UPDATE partner_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END
$$;