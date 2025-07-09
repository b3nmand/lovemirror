/*
  # Assessment System Schema

  1. New Tables
    - `assessment_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `assessment_type` (text)
      - `category_scores` (jsonb)
      - `overall_score` (numeric)
      - `overall_percentage` (numeric)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on assessment_history table
    - Add policies for authenticated users to:
      - Insert their own assessment results
      - Read their own assessment history
*/

CREATE TABLE IF NOT EXISTS assessment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  assessment_type text NOT NULL,
  category_scores jsonb NOT NULL,
  overall_score numeric NOT NULL,
  overall_percentage numeric NOT NULL,
  completed_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE assessment_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own assessment results"
  ON assessment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own assessment history"
  ON assessment_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);