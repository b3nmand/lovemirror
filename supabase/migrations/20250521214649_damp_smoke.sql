/*
  # Update profiles table to use date of birth instead of age

  1. Changes
    - Replace age column with dob column
    - Add constraint to ensure dob is not in the future
    - Add constraint to ensure dob is not before 1900

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE profiles
DROP COLUMN IF EXISTS age,
ADD COLUMN dob date NOT NULL,
ADD CONSTRAINT dob_not_future CHECK (dob <= CURRENT_DATE),
ADD CONSTRAINT dob_not_too_old CHECK (dob >= '1900-01-01');