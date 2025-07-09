import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Gem, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { createCheckoutSession } from '@/lib/stripeCheckout';

// Example plan data (replace priceId with your real Stripe price IDs)
const plans = [
  {
    id: '1_month',
    name: '1 Month',
    description: 'Everything for 1 Month',
    price: 10,
    interval: 'month',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_1_MONTH,
    features: [
      'AI Development Plan',
      'Compatibility Reports',
      'Delusional Score Insights',
    ],
  },
  {
    id: '3_months',
    name: '3 Months',
    description: 'Everything for 3 Months',
    price: 15,
    interval: '3 months',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_3_MONTH,
    popular: true,
    features: [
      'Progress Tracking',
      'External Assessor Tools',
      'Priority Support',
    ],
  },
  {
    id: '6_months',
    name: '6 Months',
    description: 'Everything for 6 Months',
    price: 24,
    interval: '6 months',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_6_MONTH,
    features: [
      'Unlimited Assessments',
      'Priority Support',
      'Advanced Analytics',
    ],
  },
  {
    id: '12_months',
    name: '12 Months',
    description: 'Everything for 12 Months',
    price: 36,
    interval: '12 months',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_12_MONTH,
    features: [
      'AI Relationship Coach',
      'Exclusive Content',
      'VIP Support',
    ],
  },
];

export default function Subscription({ assessmentId }: { assessmentId?: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [returnUrl, setReturnUrl] = useState<string>('/dashboard');

  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        setUser(user);
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (error) throw error;
        setSubscription(subscriptionData);
        const storedReturnUrl = localStorage.getItem('subscriptionReturnUrl');
        if (storedReturnUrl) setReturnUrl(storedReturnUrl);
      } catch (error) {
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubscribe = async (planId: string, priceId: string) => {
    if (!user) return;
    if (!priceId) {
      toast.error('No Stripe price ID set for this plan. Please contact support.');
      return;
    }
    try {
      setProcessingPayment(planId);
      await createCheckoutSession({
        userId: user.id,
        priceId,
        planId,
        assessmentId,
      });
    } catch (error) {
      toast.error('Failed to initiate subscription process');
    } finally {
      setProcessingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (subscription) {
    return (
      <div className="container max-w-6xl mx-auto p-4 sm:p-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4" style={{ 
            background: 'linear-gradient(90deg, #ff0099, #9900ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            You're Already Subscribed!
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            You already have an active subscription. Enjoy all premium features of Love Mirror.
          </p>
        </div>
        <div className="flex justify-center mb-8">
          <Alert className="max-w-md bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Active Subscription</AlertTitle>
            <AlertDescription className="text-green-700">
              Your subscription is active until {new Date(subscription.current_period_end).toLocaleDateString()}.
            </AlertDescription>
          </Alert>
        </div>
        <div className="flex justify-center">
          <Button
            onClick={() => navigate(returnUrl)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white [&_svg]:text-white"
          >
            Continue to {returnUrl === '/dashboard' ? 'Dashboard' : 'Your Content'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 sm:p-6 py-8 md:py-12">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4" style={{ 
          background: 'linear-gradient(90deg, #ff0099, #9900ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Unlock Premium Features
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
          Subscribe to access all premium features including detailed assessment results, 
          partner compatibility, external feedback, and personalized improvement plans.
        </p>
      </div>
      <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8 md:mb-12">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col border-pink-100 hover:shadow-lg transition-all h-full">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                  <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{plan.description}</CardDescription>
              </div>
              <Gem className="h-6 w-6 text-pink-500" />
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="mb-4">
                <span className="text-2xl sm:text-3xl font-bold">£{plan.price}</span>
                <span className="text-muted-foreground text-xs sm:text-base"> / {plan.interval}</span>
            </div>
            <ul className="space-y-2 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-2 shrink-0" /><span>{feature}</span></li>
                ))}
            </ul>
          </CardContent>
          <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white [&_svg]:text-white text-sm sm:text-base"
                onClick={() => handleSubscribe(plan.id, plan.priceId)}
                disabled={processingPayment === plan.id}
              >
                {processingPayment === plan.id ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />Processing...</>
                ) : `Subscribe ${plan.name}`}
            </Button>
          </CardFooter>
        </Card>
        ))}
      </div>
      <div className="text-center">
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          All plans include a 7-day money-back guarantee. Cancel anytime.
        </p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="w-full sm:w-auto"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}