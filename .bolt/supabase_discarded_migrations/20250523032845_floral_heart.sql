/*
  # Fix Partner Invitation System

  1. Changes:
    - Add trigger to auto-generate invitation code
    - Fix permissions for partner invitation creation
    - Add better handling of user email retrieval

  2. Security:
    - Ensure proper RLS policies are in place
    - Fix policy for invitation email viewing
*/

-- Fix policy for viewing invitations sent to email
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON partner_invitations;
CREATE POLICY "Users can view invitations sent to their email"
  ON partner_invitations
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
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

-- Fix function to ensure sender_email is populated
CREATE OR REPLACE FUNCTION set_sender_email() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_email IS NULL THEN
    NEW.sender_email := (SELECT email FROM auth.users WHERE id = NEW.sender_id);
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

-- Drop existing handle_invitation_expiration_trigger if it exists
DROP TRIGGER IF EXISTS handle_invitation_expiration_trigger ON partner_invitations;

-- Fix function to handle invitation expiration
CREATE OR REPLACE FUNCTION handle_invitation_expiration()
RETURNS TRIGGER AS $$
BEGIN
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

-- Create trigger for invitation expiration
CREATE TRIGGER handle_invitation_expiration_trigger
  AFTER INSERT ON partner_invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_invitation_expiration();

-- Run task to mark expired invitations
DO $$
BEGIN
  UPDATE partner_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END
$$;