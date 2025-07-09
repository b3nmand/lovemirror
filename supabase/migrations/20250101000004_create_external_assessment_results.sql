/*
  # Create External Assessment Results Table

  1. New Tables
    - `external_assessment_results`
      - `id` (uuid, primary key)
      - `assessor_id` (uuid, references external_assessors)
      - `user_id` (uuid, references auth.users)
      - `assessment_type` (text)
      - `category_scores` (jsonb)
      - `overall_score` (numeric)
      - `overall_percentage` (numeric)
      - `feedback` (text)
      - `category_gap` (jsonb)
      - `delusional_score` (numeric)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on external_assessment_results table
    - Add policies for authenticated users to view their own results
    - Add policies for anonymous users to create results
*/

-- External Assessment Results Table
CREATE TABLE IF NOT EXISTS external_assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessor_id uuid REFERENCES external_assessors NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  assessment_type text NOT NULL,
  category_scores jsonb NOT NULL,
  overall_score numeric NOT NULL,
  overall_percentage numeric NOT NULL,
  feedback text,
  category_gap jsonb,
  delusional_score numeric,
  completed_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_assessment_type 
  CHECK (assessment_type IN ('high-value-man', 'wife-material', 'bridal-price'))
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS external_assessment_results_assessor_id_idx ON external_assessment_results(assessor_id);
CREATE INDEX IF NOT EXISTS external_assessment_results_user_id_idx ON external_assessment_results(user_id);
CREATE INDEX IF NOT EXISTS external_assessment_results_assessment_type_idx ON external_assessment_results(assessment_type);
CREATE INDEX IF NOT EXISTS external_assessment_results_user_id_category_gap_idx ON external_assessment_results(user_id, (delusional_score IS NOT NULL));

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

-- Add comments
COMMENT ON COLUMN external_assessment_results.category_gap IS 'Difference between self-assessment and external assessment scores';
COMMENT ON COLUMN external_assessment_results.delusional_score IS 'Overall delusional score based on category gaps'; 