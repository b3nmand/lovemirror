/*
  # Delusional Score Calculation Implementation

  1. Changes:
    - Add `category_gap` column to `external_assessment_results` table
    - Add `delusional_score` column to `external_assessment_results` table
    - Add necessary indexes for performance optimization

  2. Purpose:
    - Enable real-time calculation of gaps between self-perception and external assessment
    - Store calculated gap data for reporting and analysis
*/

-- Add column for category gaps (difference between self-assessment and external assessment)
ALTER TABLE IF EXISTS external_assessment_results
ADD COLUMN IF NOT EXISTS category_gap jsonb;

-- Add column for overall delusional score (average gap across categories)
ALTER TABLE IF EXISTS external_assessment_results
ADD COLUMN IF NOT EXISTS delusional_score numeric;

-- Create index for faster searching when calculating delusional scores
CREATE INDEX IF NOT EXISTS external_assessment_results_user_id_category_gap_idx 
ON external_assessment_results(user_id, (delusional_score IS NOT NULL));