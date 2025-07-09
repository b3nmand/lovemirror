/*
  # Add assessment_type to external_assessors table

  1. Changes
    - Add assessment_type column to external_assessors table
    - This allows tracking which type of assessment is being requested from external assessors
    - Default to null, but will be filled based on user's gender and selection

  2. Security
    - Maintain existing RLS policies
*/

-- Add assessment_type column to external_assessors table
ALTER TABLE IF EXISTS external_assessors
ADD COLUMN IF NOT EXISTS assessment_type text;

-- Add constraint to ensure valid assessment types
ALTER TABLE IF EXISTS external_assessors
ADD CONSTRAINT valid_assessment_type 
CHECK (assessment_type IS NULL OR assessment_type IN ('high-value-man', 'wife-material', 'bridal-price'));