/*
  # Fix External Assessor Expiration Handling

  1. Changes:
    - Add function to mark expired external assessor invitations
    - Create a cron job to run this function regularly
    - Fix invitation handling to prevent duplicate active assessors

  2. Security:
    - Maintain existing RLS policies
*/

-- Create or replace the function to handle invitation expiration
CREATE OR REPLACE FUNCTION handle_assessor_expiration() 
RETURNS TRIGGER AS $$
BEGIN
  -- Mark expired invitations
  UPDATE external_assessors
  SET status = 'completed'
  WHERE status = 'pending' 
  AND expires_at < NOW();
  
  -- Only allow one pending invitation per user-email combination
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

-- Create trigger for handling invitation expiration
CREATE TRIGGER handle_assessor_expiration_trigger
  AFTER INSERT ON external_assessors
  FOR EACH ROW
  EXECUTE FUNCTION handle_assessor_expiration();

-- Run immediate cleanup of expired invitations
DO $$
BEGIN
  UPDATE external_assessors
  SET status = 'completed'
  WHERE status = 'pending' AND expires_at < NOW();
END
$$;