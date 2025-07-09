/*
  # Update Partner Invitations Schema for Better Email Support

  1. Changes
    - Add sender_email column to partner_invitations table for easier lookups
    - Make invitation code available immediately without requiring generation

  2. Purpose
    - Improve invitation system for better partner communication
    - Allow quick access to invitation links without requiring extra steps
*/

-- Add sender_email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'partner_invitations' 
    AND column_name = 'sender_email'
  ) THEN
    ALTER TABLE partner_invitations ADD COLUMN sender_email TEXT;
  END IF;
END $$;

-- Update the trigger function to generate invitation code immediately
CREATE OR REPLACE FUNCTION generate_invitation_code() 
RETURNS TRIGGER AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 8-character random code
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM partner_invitations 
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

-- Make sure the trigger is applied
DROP TRIGGER IF EXISTS generate_invitation_code_trigger ON partner_invitations;
CREATE TRIGGER generate_invitation_code_trigger
  BEFORE INSERT ON partner_invitations
  FOR EACH ROW
  WHEN (NEW.invitation_code IS NULL OR NEW.invitation_code = '')
  EXECUTE FUNCTION generate_invitation_code();