import { supabase } from '@/lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'expired';
  plan: string;  // Legacy field
  plan_id: string;  // New field
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

/**
 * Check if a subscription is actually active and not expired
 * @param subscription The subscription object to validate
 * @returns Boolean indicating if the subscription is truly active
 */
function isSubscriptionActuallyActive(subscription: Subscription): boolean {
  if (!subscription) return false;
  
  // Check if status is active
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return false;
  }
  
  // Check if current period has ended
  const now = new Date();
  const periodEnd = new Date(subscription.current_period_end);
  
  if (now > periodEnd) {
    return false;
  }
  
  // Check if subscription is set to cancel at period end
  if (subscription.cancel_at_period_end && now >= periodEnd) {
    return false;
  }
  
  return true;
}

/**
 * Check if a user has an active subscription
 * @param userId The user ID to check
 * @returns Boolean indicating if the user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    // Check for active subscription with proper validation
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
      
    if (subError) {
      console.error('Error checking subscription:', subError);
      throw subError;
    }
    
    // Validate that the subscription is actually active (not expired)
    if (subscription && isSubscriptionActuallyActive(subscription)) {
      return true;
    }
    
    // If subscription is expired, update its status
    if (subscription && !isSubscriptionActuallyActive(subscription)) {
      await updateExpiredSubscription(subscription.id);
    }
    
    // Check is_premium in profiles as fallback (legacy support)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error('Error checking is_premium:', profileError);
      throw profileError;
    }
    
    // Only return true if is_premium is explicitly true
    return !!profile?.is_premium;
  } catch (error) {
    console.error('Error in hasActiveSubscription:', error);
    return false;
  }
}

/**
 * Update expired subscription status
 * @param subscriptionId The ID of the expired subscription
 */
async function updateExpiredSubscription(subscriptionId: string): Promise<void> {
  try {
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);
      
    console.log(`Updated subscription ${subscriptionId} to expired status`);
  } catch (error) {
    console.error('Error updating expired subscription:', error);
  }
}

/**
 * Get the user's current subscription details
 * @param userId The user ID to check
 * @returns The subscription object or null if no active subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
      
    if (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
    
    // Validate that the subscription is actually active
    if (data && isSubscriptionActuallyActive(data)) {
      return data;
    }
    
    // If subscription is expired, update it and return null
    if (data && !isSubscriptionActuallyActive(data)) {
      await updateExpiredSubscription(data.id);
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
}

/**
 * Clean up expired subscriptions for all users
 * This should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredSubscriptions(): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    // Find all expired subscriptions
    const { data: expiredSubscriptions, error } = await supabase
      .from('subscriptions')
      .select('id, current_period_end')
      .eq('status', 'active')
      .lt('current_period_end', now);
      
    if (error) {
      console.error('Error finding expired subscriptions:', error);
      return;
    }
    
    // Update expired subscriptions
    for (const sub of expiredSubscriptions || []) {
      await updateExpiredSubscription(sub.id);
    }
    
    console.log(`Cleaned up ${expiredSubscriptions?.length || 0} expired subscriptions`);
  } catch (error) {
    console.error('Error in cleanupExpiredSubscriptions:', error);
  }
}

/**
 * Store a new subscription in the database
 * @param subscriptionData The subscription data to store
 * @returns The created subscription or null if failed
 */
export async function createSubscription(subscriptionData: Partial<Subscription>): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createSubscription:', error);
    return null;
  }
}

/**
 * Update an existing subscription
 * @param subscriptionId The ID of the subscription to update
 * @param updateData The data to update
 * @returns The updated subscription or null if failed
 */
export async function updateSubscription(
  subscriptionId: string, 
  updateData: Partial<Subscription>
): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateSubscription:', error);
    return null;
  }
}

/**
 * Cancel a subscription (marks it as canceled but doesn't end access immediately)
 * @param subscriptionId The ID of the subscription to cancel
 * @returns Boolean indicating success
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);
      
    if (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in cancelSubscription:', error);
    return false;
  }
}

/**
 * Check if a specific route requires subscription
 * @param pathname The current route pathname
 * @returns Boolean indicating if the route requires subscription
 */
export function isSubscriptionRequiredRoute(pathname: string): boolean {
  const restrictedRoutes = [
    '/bridal-price-results',
    '/high-value-results',
    '/wife-material-results',
    '/invite-partner',
    '/assessors',
    '/external-results',
    '/self-improvement',
    '/goals',
    '/compatibility'
  ];
  
  return restrictedRoutes.some(route => pathname.startsWith(route));
}