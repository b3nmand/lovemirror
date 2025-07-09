/*
  # Add Service Role Policies for Edge Functions

  1. Changes
    - Add policies allowing service role to update profiles
    - Add policies allowing service role to insert subscriptions
    - Ensure Edge Functions can manage user data after payment

  2. Purpose
    - Enable verify-checkout-session function to update user premium status
    - Allow create-checkout-session function to create subscriptions
    - Maintain security while allowing necessary operations
*/

-- Safely create service role policies for profiles
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Service role can update any profile" ON profiles;
  
  -- Create new policy
  CREATE POLICY "Service role can update any profile"
    ON profiles
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
    
  -- Add comment
  COMMENT ON POLICY "Service role can update any profile" ON profiles IS 'Allows Edge Functions to update user premium status after payment';
END $$;

-- Safely create service role policies for subscriptions
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Service role can insert subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Service role can update subscriptions" ON subscriptions;
  
  -- Create new policies
  CREATE POLICY "Service role can insert subscriptions"
    ON subscriptions
    FOR INSERT
    TO service_role
    WITH CHECK (true);
    
  CREATE POLICY "Service role can update subscriptions"
    ON subscriptions
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
    
  -- Add comments
  COMMENT ON POLICY "Service role can insert subscriptions" ON subscriptions IS 'Allows Edge Functions to create subscription records after payment';
  COMMENT ON POLICY "Service role can update subscriptions" ON subscriptions IS 'Allows Edge Functions to update subscription status after payment';
END $$; 