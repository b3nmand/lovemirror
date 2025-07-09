/*
  # External Assessors System

  1. New Tables
    - `external_assessors`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - The user who created the invitation
      - `email` (text) - Email of the external assessor
      - `relationship` (text) - Relationship to the user (friend, family, colleague, etc.)
      - `invitation_code` (text, unique) - Unique code for invitation link
      - `status` (text) - Status of the assessment (pending, completed)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on external_assessors table
    - Add policies for authenticated users to:
      - Insert their own assessors
      - Read their own assessors
      - Update their own assessors
      - Delete their own assessors
*/

-- External Assessors Table
CREATE TABLE IF NOT EXISTS external_assessors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  email text NOT NULL,
  relationship text NOT NULL,
  invitation_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed'))
);

-- Create indexes for faster lookups
CREATE INDEX external_assessors_user_id_idx ON external_assessors(user_id);
CREATE INDEX external_assessors_invitation_code_idx ON external_assessors(invitation_code);
CREATE INDEX external_assessors_status_idx ON external_assessors(status);

-- Enable Row Level Security
ALTER TABLE external_assessors ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own external assessors"
  ON external_assessors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to generate a unique invitation code
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

-- Trigger to generate invitation code on insert
CREATE TRIGGER generate_assessor_invitation_code_trigger
  BEFORE INSERT ON external_assessors
  FOR EACH ROW
  WHEN (NEW.invitation_code IS NULL)
  EXECUTE FUNCTION generate_assessor_invitation_code();