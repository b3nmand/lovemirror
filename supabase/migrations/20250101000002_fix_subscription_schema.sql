/*
  # Fix Subscription Table Schema Mismatch

  1. Changes
    - Add plan_id column if it doesn't exist
    - Ensure plan column exists for backward compatibility
    - Update Edge Function to use correct field names

  2. Purpose
    - Fix mismatch between Edge Function and database schema
    - Ensure both plan and plan_id fields are available
*/

-- Add plan_id column if it doesn't exist (for newer schema)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS plan_id text;

-- Add plan column if it doesn't exist (for backward compatibility)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS plan text;

-- Update existing records to have plan_id = plan if plan_id is null
UPDATE subscriptions 
SET plan_id = plan 
WHERE plan_id IS NULL AND plan IS NOT NULL;

-- Update existing records to have plan = plan_id if plan is null
UPDATE subscriptions 
SET plan = plan_id 
WHERE plan IS NULL AND plan_id IS NOT NULL;

-- Create index for plan_id lookups
CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON subscriptions(plan_id);

-- Add comments
COMMENT ON COLUMN subscriptions.plan IS 'Legacy plan field for backward compatibility';
COMMENT ON COLUMN subscriptions.plan_id IS 'Primary plan identifier field'; 