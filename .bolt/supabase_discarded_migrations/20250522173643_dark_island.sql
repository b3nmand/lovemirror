/*
  # Fix Compatibility System Tables and Policies

  1. Changes
    - Drop existing tables and recreate them with proper constraints
    - Add proper indexes for performance
    - Update policies with correct permissions
    - Add triggers for invitation management

  2. Security
    - Enable RLS on all tables
    - Add proper policies for data access
    - Ensure secure invitation handling
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS compatibility_scores;
DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS partner_invitations;

-- Partner Invitations Table
CREATE TABLE partner_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users NOT NULL,
  invitation_code text UNIQUE NOT NULL DEFAULT generate_invitation_code(),
  email text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Create index for faster invitation lookups
CREATE INDEX partner_invitations_sender_id_idx ON partner_invitations(sender_id);
CREATE INDEX partner_invitations_status_idx ON partner_invitations(status);

-- Relationships Table
CREATE TABLE relationships (
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

-- Create indexes for relationship lookups
CREATE INDEX relationships_user1_id_idx ON relationships(user1_id);
CREATE INDEX relationships_user2_id_idx ON relationships(user2_id);
CREATE INDEX relationships_status_idx ON relationships(status);

-- Compatibility Scores Table
CREATE TABLE compatibility_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid REFERENCES relationships NOT NULL,
  category_scores jsonb NOT NULL,
  overall_score numeric NOT NULL,
  overall_percentage numeric NOT NULL,
  analysis_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for compatibility score lookups
CREATE INDEX compatibility_scores_relationship_id_idx ON compatibility_scores(relationship_id);
CREATE INDEX compatibility_scores_analysis_date_idx ON compatibility_scores(analysis_date);

-- Enable Row Level Security
ALTER TABLE partner_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_scores ENABLE ROW LEVEL SECURITY;

-- Partner Invitations Policies
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

-- Relationships Policies
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

-- Compatibility Scores Policies
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
    SELECT EXISTS(
      SELECT 1 FROM partner_invitations 
      WHERE invitation_code = result
    ) INTO code_exists;
    
    -- If code is unique, return it
    IF NOT code_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to handle invitation expiration
CREATE OR REPLACE FUNCTION handle_invitation_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark expired invitations
  UPDATE partner_invitations
  SET status = 'expired'
  WHERE status = 'pending' 
  AND expires_at < NOW();
  
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

-- Create trigger for invitation expiration
DROP TRIGGER IF EXISTS handle_invitation_expiration_trigger ON partner_invitations;
CREATE TRIGGER handle_invitation_expiration_trigger
  AFTER INSERT OR UPDATE ON partner_invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_invitation_expiration();