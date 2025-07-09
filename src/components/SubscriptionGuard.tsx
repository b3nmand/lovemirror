import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        
        // Check if user has an active subscription
        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
          
        if (error) {
          console.error('Error checking subscription:', error);
          throw error;
        }
        
        if (!subscription) {
          // If we haven't exceeded retries, try again
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            setTimeout(verifySubscription, RETRY_DELAY);
            return;
          }
          
          // User doesn't have an active subscription, redirect to subscription page
          navigate('/subscription');
          return;
        }
        
        setIsSubscribed(true);
      } catch (error) {
        console.error('Error checking subscription status:', error);
        
        // If we haven't exceeded retries, try again
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(verifySubscription, RETRY_DELAY);
          return;
        }
        
        navigate('/subscription');
      } finally {
        setLoading(false);
      }
    };

    verifySubscription();
  }, [navigate, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Checking Subscription</CardTitle>
            <CardDescription>
              {retryCount > 0 
                ? `Verifying subscription status (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`
                : 'Please wait while we verify your subscription status'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSubscribed) {
    // This should not be rendered as we redirect in the useEffect
    return null;
  }

  return <>{children}</>;
}