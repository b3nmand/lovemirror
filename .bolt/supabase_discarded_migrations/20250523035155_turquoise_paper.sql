/*
  # External Assessors Invitation Code Generation

  1. Changes:
    - Add function to generate unique invitation codes for external assessors
    - Add trigger to automatically generate invitation codes on insert
    - Add function and trigger to handle assessor invitation expiration

  2. Purpose:
    - Automate invitation code generation for external assessors
    - Ensure uniqueness of invitation codes
    - Automatically expire old invitations
*/

-- Function to generate unique invitation code for external assessors
CREATE OR REPLACE FUNCTION generate_assessor_invitation_code() 
RETURNS TRIGGER AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 10-character random code
    result := '';
    FOR i IN 1..10 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM external_assessors 
      WHERE invitation_code = result
    ) INTO code_exists;
    
    -- If code is unique, use it
    IF NOT code_exists THEN
      NEW.invitation_code := result;
      RETURN NEW;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS generate_assessor_invitation_code_trigger ON external_assessors;

-- Create trigger for generating invitation codes
CREATE TRIGGER generate_assessor_invitation_code_trigger
  BEFORE INSERT ON external_assessors
  FOR EACH ROW
  WHEN (NEW.invitation_code IS NULL OR NEW.invitation_code = '')
  EXECUTE FUNCTION generate_assessor_invitation_code();

-- Function to handle assessor invitation expiration
CREATE OR REPLACE FUNCTION handle_assessor_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow one pending invitation per user-email combination
  -- This allows inviting the same person for different assessment types
  IF NEW.status = 'pending' THEN
    UPDATE external_assessors
    SET status = 'completed'
    WHERE user_id = NEW.user_id
      AND email = NEW.email
      AND id != NEW.id
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_assessor_expiration_trigger ON external_assessors;

-- Create trigger for assessor invitation expiration
CREATE TRIGGER handle_assessor_expiration_trigger
  AFTER INSERT ON external_assessors
  FOR EACH ROW
  EXECUTE FUNCTION handle_assessor_expiration();

-- Run task to mark expired invitations
DO $$
BEGIN
  UPDATE external_assessors
  SET status = 'completed'
  WHERE status = 'pending' AND expires_at < NOW();
END
$$;