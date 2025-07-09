/*
  # Fix Partner Invitation System

  1. Changes
    - Update the policy for viewing invitations sent to email
    - Create a trigger for generating invitation codes
    - Fix invitation code generation to happen immediately
    - Ensure RLS policies don't rely on auth.users table

  2. Security
    - Improve policy security by removing direct access to auth.users table
    - Use stored sender_email instead of trying to join with users table
*/

-- Modify the policy for viewing invitations sent to email
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON partner_invitations;

CREATE POLICY "Users can view invitations sent to their email"
  ON partner_invitations
  FOR SELECT
  TO authenticated
  USING (
    email = auth.email()
  );

-- Create or replace the function to generate invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code() 
RETURNS TRIGGER AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate an 8-character random code
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

-- Create trigger for generating invitation codes
DROP TRIGGER IF EXISTS generate_invitation_code_trigger ON partner_invitations;
CREATE TRIGGER generate_invitation_code_trigger
  BEFORE INSERT ON partner_invitations
  FOR EACH ROW
  WHEN (NEW.invitation_code IS NULL OR NEW.invitation_code = '')
  EXECUTE FUNCTION generate_invitation_code();

-- Make sure sender_email is populated with user email
CREATE OR REPLACE FUNCTION set_sender_email() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_email IS NULL THEN
    NEW.sender_email := auth.email();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for setting sender email
DROP TRIGGER IF EXISTS set_sender_email_trigger ON partner_invitations;
CREATE TRIGGER set_sender_email_trigger
  BEFORE INSERT ON partner_invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_sender_email();