import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { hasActiveSubscription, getUserSubscription } from '@/lib/subscription';
import type { Subscription } from '@/lib/subscription';

interface UseSubscriptionReturn {
  isSubscribed: boolean;
  subscription: Subscription | null;
  loading: boolean;
  error: Error | null;
  checkSubscription: () => Promise<void>;
}

/**
 * Hook to check and manage user subscription status
 */
export function useSubscription(): UseSubscriptionReturn {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSubscribed(false);
        setSubscription(null);
        return;
      }
      
      // Check subscription status
      const hasSubscription = await hasActiveSubscription(user.id);
      setIsSubscribed(hasSubscription);
      
      if (hasSubscription) {
        const subscriptionData = await getUserSubscription(user.id);
        setSubscription(subscriptionData);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err instanceof Error ? err : new Error('Failed to check subscription'));
      setIsSubscribed(false);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Listen for auth state changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });
    
    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  return {
    isSubscribed,
    subscription,
    loading,
    error,
    checkSubscription
  };
}