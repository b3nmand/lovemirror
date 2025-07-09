/*
  # Add Premium Fields to Profiles Table

  1. Changes
    - Add is_premium boolean field to profiles table
    - Add last_plan_id text field to profiles table  
    - Add last_assessment_id text field to profiles table
    - Set default values for existing records

  2. Purpose
    - Enable Edge Functions to update user premium status
    - Track which plan and assessment the user last purchased
*/

-- Add premium fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_plan_id text,
ADD COLUMN IF NOT EXISTS last_assessment_id text;

-- Update existing profiles to have is_premium = false by default
UPDATE profiles 
SET is_premium = false 
WHERE is_premium IS NULL;

-- Create index for faster premium status lookups
CREATE INDEX IF NOT EXISTS profiles_is_premium_idx ON profiles(is_premium);

-- Add comment to document the new fields
COMMENT ON COLUMN profiles.is_premium IS 'Whether the user has premium access';
COMMENT ON COLUMN profiles.last_plan_id IS 'The last plan ID the user purchased';
COMMENT ON COLUMN profiles.last_assessment_id IS 'The last assessment ID the user purchased'; 