import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase, getProfile } from '@/lib/supabase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Hook to handle redirection after payment completion
 * Checks URL parameters for success or canceled status
 */
export function useRedirectAfterPayment() {
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();

  const verifySubscriptionWithRetry = async (retryCount = 0): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check subscription status
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      
      if (subscription) {
        return true;
      }

      // If no subscription found and we haven't exceeded retries, wait and try again
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return verifySubscriptionWithRetry(retryCount + 1);
      }

      return false;
    } catch (error) {
      console.error('Error verifying subscription:', error);
      return false;
    }
  };

  useEffect(() => {
    const handlePaymentRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const state = urlParams.get('state');
      const success = state === 'payment_success';
      const canceled = urlParams.get('canceled') === 'true';
      
      if (success) {
        // First show success message
        toast.success('Payment successful! Setting up your subscription...');
        
        // Get the return URL from localStorage
        const returnUrl = localStorage.getItem('subscriptionReturnUrl');
        
        // Clear localStorage
        localStorage.removeItem('subscriptionReturnUrl');
        
        // Verify subscription with retries
        const isSubscribed = await verifySubscriptionWithRetry();
        
        if (!isSubscribed) {
          toast.error('There was a delay in activating your subscription. Please contact support if this persists.');
          navigate('/subscription', { replace: true });
          return;
        }

        // Force refresh subscription status in the app
        await checkSubscription();

        // Force refresh the profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await getProfile(user.id);
        }

        toast.success('Your subscription is now active!');

        // Only navigate to relative paths to avoid cross-origin issues
        if (returnUrl && returnUrl.startsWith('/')) {
          navigate(returnUrl, { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else if (canceled) {
        toast.error('Payment was canceled.');
        navigate('/dashboard', { replace: true });
      }
    };
    
    handlePaymentRedirect();
  }, [navigate, checkSubscription]);
}