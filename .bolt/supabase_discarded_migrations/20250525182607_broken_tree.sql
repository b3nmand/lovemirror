/*
  # Fix Assessor Expiration Function

  1. Changes:
    - Update the handle_assessor_expiration function to properly handle invitation expiration
    - Ensure proper trigger execution for assessor invitations

  2. Purpose:
    - Fix issues with assessor invitation expiration
    - Ensure only one active invitation exists per user-email combination
*/

-- Function to handle assessor invitation expiration
CREATE OR REPLACE FUNCTION handle_assessor_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark expired invitations
  UPDATE external_assessors
  SET status = 'completed'
  WHERE status = 'pending' AND expires_at < NOW();
  
  -- Only allow one pending invitation per user-email combination
  -- This allows inviting the same person for different assessment types
  IF NEW.status = 'pending' THEN
    UPDATE external_assessors
    SET status = 'completed'
    WHERE user_id = NEW.user_id
      AND email = NEW.email
      AND id != NEW.id
      AND status = 'pending'
      AND assessment_type = NEW.assessment_type;
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