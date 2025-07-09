/*
  # Add sender_email field to partner_invitations table

  1. Changes:
    - Add sender_email column to partner_invitations table
    - This enables storing the sender's email directly in the invitation
    - Helps avoid permission issues when querying auth.users

  2. Purpose:
    - Eliminates the need to join with the auth.users table
    - Resolves permission denied errors for table users (code 42501)
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