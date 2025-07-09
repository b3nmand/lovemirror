import { supabase } from '@/lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
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
 * Check if a user has an active subscription
 * @param userId The user ID to check
 * @returns Boolean indicating if the user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    // Check for active subscription
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
    if (subscription) return true;

    // If no active subscription, check is_premium in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .maybeSingle();
    if (profileError) {
      console.error('Error checking is_premium:', profileError);
      throw profileError;
    }
    return !!profile?.is_premium;
  } catch (error) {
    console.error('Error in hasActiveSubscription:', error);
    return false;
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
    
    return data;
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
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