/*
  # Create External Assessors Table

  1. New Tables
    - `external_assessors`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email` (text)
      - `relationship` (text)
      - `invitation_code` (text, unique)
      - `status` (text: 'pending', 'completed')
      - `assessment_type` (text)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on external_assessors table
    - Add policies for authenticated users to manage their own assessors
*/

-- External Assessors Table
CREATE TABLE IF NOT EXISTS external_assessors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  email text NOT NULL,
  relationship text NOT NULL,
  invitation_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  assessment_type text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed')),
  CONSTRAINT valid_assessment_type CHECK (assessment_type IN ('high-value-man', 'wife-material', 'bridal-price') OR assessment_type IS NULL)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS external_assessors_user_id_idx ON external_assessors(user_id);
CREATE INDEX IF NOT EXISTS external_assessors_invitation_code_idx ON external_assessors(invitation_code);
CREATE INDEX IF NOT EXISTS external_assessors_status_idx ON external_assessors(status);
CREATE INDEX IF NOT EXISTS external_assessors_assessment_type_idx ON external_assessors(assessment_type);

-- Enable Row Level Security
ALTER TABLE external_assessors ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own external assessors"
  ON external_assessors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to generate unique invitation codes
CREATE OR REPLACE FUNCTION generate_assessor_invitation_code() 
RETURNS TEXT AS $$
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
    SELECT EXISTS(SELECT 1 FROM external_assessors WHERE invitation_code = result) INTO code_exists;
    
    -- If code is unique, return it
    IF NOT code_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to handle assessor expiration
CREATE OR REPLACE FUNCTION handle_assessor_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark expired assessors as completed
  UPDATE external_assessors
  SET status = 'completed'
  WHERE status = 'pending' AND expires_at < NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER generate_assessor_invitation_code_trigger
  BEFORE INSERT ON external_assessors
  FOR EACH ROW
  WHEN (NEW.invitation_code IS NULL OR NEW.invitation_code = '')
  EXECUTE FUNCTION generate_assessor_invitation_code();

CREATE TRIGGER handle_assessor_expiration_trigger
  AFTER INSERT OR UPDATE ON external_assessors
  FOR EACH ROW
  EXECUTE FUNCTION handle_assessor_expiration();

-- Run immediate cleanup for any expired assessors
DO $$
BEGIN
  UPDATE external_assessors
  SET status = 'completed'
  WHERE status = 'pending' AND expires_at < NOW();
END
$$; 