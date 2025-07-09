/*
  # Compatibility Score Analysis System

  1. New Tables
    - `partner_invitations`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references users)
      - `invitation_code` (text, unique)
      - `email` (text)
      - `status` (text: 'pending', 'accepted', 'declined', 'expired')
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `relationships`
      - `id` (uuid, primary key)
      - `user1_id` (uuid, references users)
      - `user2_id` (uuid, references users)
      - `status` (text: 'active', 'inactive')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `compatibility_scores`
      - `id` (uuid, primary key)
      - `relationship_id` (uuid, references relationships)
      - `category_scores` (jsonb)
      - `overall_score` (numeric)
      - `overall_percentage` (numeric)
      - `analysis_date` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Manage their own invitations
      - View relationships they're part of
      - View compatibility scores for their relationships
*/

-- Partner Invitations Table
CREATE TABLE IF NOT EXISTS partner_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users NOT NULL,
  invitation_code text UNIQUE NOT NULL,
  email text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Relationships Table
CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES auth.users NOT NULL,
  user2_id uuid REFERENCES auth.users NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT different_users CHECK (user1_id != user2_id),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive')),
  CONSTRAINT unique_relationship UNIQUE (user1_id, user2_id)
);

-- Compatibility Scores Table
CREATE TABLE IF NOT EXISTS compatibility_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid REFERENCES relationships NOT NULL,
  category_scores jsonb NOT NULL,
  overall_score numeric NOT NULL,
  overall_percentage numeric NOT NULL,
  analysis_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE partner_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_scores ENABLE ROW LEVEL SECURITY;

-- Policies for partner_invitations
CREATE POLICY "Users can manage their own invitations"
  ON partner_invitations
  FOR ALL
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view invitations sent to their email"
  ON partner_invitations
  FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Policies for relationships
CREATE POLICY "Users can view relationships they're part of"
  ON relationships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create relationships they're part of"
  ON relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update relationships they're part of"
  ON relationships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Policies for compatibility_scores
CREATE POLICY "Users can view compatibility scores for their relationships"
  ON compatibility_scores
  FOR SELECT
  TO authenticated
  USING (
    relationship_id IN (
      SELECT id FROM relationships 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can create compatibility scores for their relationships"
  ON compatibility_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    relationship_id IN (
      SELECT id FROM relationships 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Function to generate unique invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code() 
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
    SELECT EXISTS(SELECT 1 FROM partner_invitations WHERE invitation_code = result) INTO code_exists;
    
    -- If code is unique, return it
    IF NOT code_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check and expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
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
      AND status = 'pending' 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to expire old invitations when new ones are created
CREATE TRIGGER expire_invitations_trigger
AFTER INSERT ON partner_invitations
FOR EACH ROW
EXECUTE FUNCTION expire_old_invitations();