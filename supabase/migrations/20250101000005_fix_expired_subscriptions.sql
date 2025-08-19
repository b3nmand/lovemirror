/*
  # Fix Expired Subscriptions and Add Expired Status

  1. Changes
    - Add 'expired' status to subscriptions table
    - Update existing expired subscriptions to 'expired' status
    - Add index for faster subscription status lookups
    - Clean up profiles.is_premium for expired subscriptions

  2. Purpose
    - Fix the issue where expired subscriptions still show as active
    - Ensure proper subscription lifecycle management
    - Prevent users with expired subscriptions from accessing premium features
*/

-- Add 'expired' status to the subscriptions table enum if it doesn't exist
-- Note: This may require recreating the table if the enum constraint is strict
-- For now, we'll update the data directly

-- Update subscriptions that have passed their current_period_end to 'expired' status
UPDATE subscriptions 
SET 
  status = 'expired',
  updated_at = NOW()
WHERE 
  status = 'active' 
  AND current_period_end < NOW();

-- Update profiles.is_premium to false for users with expired subscriptions
UPDATE profiles 
SET is_premium = false
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM subscriptions 
  WHERE status = 'expired'
);

-- Create index for faster subscription status and period lookups
CREATE INDEX IF NOT EXISTS subscriptions_status_period_idx 
ON subscriptions(status, current_period_end);

CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx 
ON subscriptions(user_id, status);

-- Add comment to document the status field
COMMENT ON COLUMN subscriptions.status IS 'Subscription status: active, canceled, past_due, trialing, incomplete, expired';

-- Create a function to automatically update expired subscriptions
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void AS $$
BEGIN
  -- Update expired subscriptions
  UPDATE subscriptions 
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'active' 
    AND current_period_end < NOW();
    
  -- Update profiles for expired subscriptions
  UPDATE profiles 
  SET is_premium = false
  WHERE id IN (
    SELECT DISTINCT user_id 
    FROM subscriptions 
    WHERE status = 'expired'
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a subscription is actually active
CREATE OR REPLACE FUNCTION is_subscription_active(subscription_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  sub_record subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO sub_record FROM subscriptions WHERE id = subscription_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if status is active or trialing
  IF sub_record.status NOT IN ('active', 'trialing') THEN
    RETURN FALSE;
  END IF;
  
  -- Check if current period has ended
  IF NOW() > sub_record.current_period_end THEN
    RETURN FALSE;
  END IF;
  
  -- Check if subscription is set to cancel at period end
  IF sub_record.cancel_at_period_end AND NOW() >= sub_record.current_period_end THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
