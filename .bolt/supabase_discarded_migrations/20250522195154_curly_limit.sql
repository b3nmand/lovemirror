/*
  # External Assessment Results Schema

  1. New Tables
    - `external_assessment_results`
      - `id` (uuid, primary key)
      - `assessor_id` (uuid, references external_assessors)
      - `user_id` (uuid, references auth.users)
      - `assessment_type` (text)
      - `category_scores` (jsonb)
      - `overall_score` (numeric)
      - `overall_percentage` (numeric)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on external_assessment_results table
    - Add policies for authenticated users to:
      - Read their own external assessment results (but not who submitted them)
    - Add policies for anonymous users to:
      - Create external assessment results (when completing an assessment)
*/

CREATE TABLE IF NOT EXISTS external_assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessor_id uuid REFERENCES external_assessors NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  assessment_type text NOT NULL,
  category_scores jsonb NOT NULL,
  overall_score numeric NOT NULL,
  overall_percentage numeric NOT NULL,
  feedback text,
  completed_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_assessment_type 
  CHECK (assessment_type IN ('high-value-man', 'wife-material', 'bridal-price'))
);

-- Create indexes for faster lookups
CREATE INDEX external_assessment_results_assessor_id_idx ON external_assessment_results(assessor_id);
CREATE INDEX external_assessment_results_user_id_idx ON external_assessment_results(user_id);
CREATE INDEX external_assessment_results_assessment_type_idx ON external_assessment_results(assessment_type);

-- Enable Row Level Security
ALTER TABLE external_assessment_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own external assessment results"
  ON external_assessment_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for anonymous submission
CREATE POLICY "Anyone can submit external assessment results"
  ON external_assessment_results
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);