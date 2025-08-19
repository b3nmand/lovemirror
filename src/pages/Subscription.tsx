import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    price: 6.99,
    interval: 'month',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_1_MONTH,
    popular: false,
    features: [
      'AI Development Plan',
      'Compatibility Reports',
      'Delusional Score Insights',
      'Basic Support'
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
      'All 1 Month Features'
    ],
  },
  {
    id: '6_months',
    name: '6 Months',
    description: 'Everything for 6 Months',
    price: 24,
    interval: '6 months',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_6_MONTH,
    popular: false,
    features: [
      'Unlimited Assessments',
      'Priority Support',
      'Advanced Analytics',
      'All 3 Month Features'
    ],
  },
  {
    id: '12_months',
    name: '12 Months',
    description: 'Everything for 12 Months',
    price: 36,
    interval: '12 months',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_12_MONTH,
    popular: false,
    features: [
      'AI Relationship Coach',
      'Exclusive Content',
      'VIP Support',
      'All 6 Month Features'
    ],
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [returnUrl, setReturnUrl] = useState<string>('/dashboard');
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

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
        
        // PRIMARY: Check assessment history table for completed assessments
        const { data: assessments, error: assessmentError } = await supabase
          .from('assessment_history')
          .select('id, assessment_type, completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });
        
        if (!assessmentError && assessments && assessments.length > 0) {
          // All assessments in assessment_history are completed (they're only inserted after completion)
          const latestAssessment = assessments[0];
          setAssessmentId(latestAssessment.id);
          console.log('Completed assessment found:', {
            id: latestAssessment.id,
            type: latestAssessment.assessment_type,
            date: latestAssessment.completed_at
          });
        } else {
          console.log('No completed assessments found for user');
        }
        
        // FALLBACK: Check URL parameters only if no database assessment found
        if (!assessmentId) {
          const urlParams = new URLSearchParams(window.location.search);
          const urlAssessmentId = urlParams.get('assessmentId');
          if (urlAssessmentId) {
            console.log('Using assessment ID from URL as fallback:', urlAssessmentId);
            setAssessmentId(urlAssessmentId);
          }
        }
        
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
        console.error('Error in checkUser:', error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate, assessmentId]);

  const handleSubscribe = async (planId: string, priceId: string) => {
    if (!user) return;
    if (!priceId) {
      toast.error('No Stripe price ID set for this plan. Please contact support.');
      return;
    }
    if (!assessmentId) {
      toast.error('You must complete an assessment before subscribing to premium features');
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
      toast.error(error instanceof Error ? error.message : 'Failed to initiate subscription process');
    } finally {
      setProcessingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (subscription) {
    return (
      <div className="w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 pb-20 sm:pb-24">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B1B1B] mb-3 sm:mb-4 lg:mb-6">
            You're Already Subscribed!
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-[#5F6368] max-w-xl mx-auto px-2">
            You already have an active subscription. Enjoy all premium features of Love Mirror.
          </p>
        </div>
        <div className="flex justify-center mb-6 sm:mb-8">
          <Alert className="max-w-md bg-green-50 border-green-200 mx-3">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 text-sm sm:text-base">Active Subscription</AlertTitle>
            <AlertDescription className="text-green-700 text-xs sm:text-sm">
              Your subscription is active until {new Date(subscription.current_period_end).toLocaleDateString()}.
            </AlertDescription>
          </Alert>
        </div>
        <div className="flex justify-center">
          <Button
            onClick={() => navigate(returnUrl)}
            className="bg-[#5A3DFF] hover:bg-[#4A2DEF] text-white px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Continue to {returnUrl === '/dashboard' ? 'Dashboard' : 'Your Content'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 pb-20 sm:pb-24">
      <div className="text-center mb-6 sm:mb-8 lg:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B1B1B] mb-3 sm:mb-4 lg:mb-6">
          Unlock Premium Features
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-[#5F6368] mb-6 sm:mb-8 max-w-xl mx-auto px-2">
          Subscribe to access all premium features including detailed assessment results, 
          partner compatibility, external feedback, and personalized improvement plans.
        </p>
        
        {!assessmentId && (
          <Alert className="max-w-xl mx-auto bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 text-sm sm:text-base">Assessment Required</AlertTitle>
            <AlertDescription className="text-amber-700 text-xs sm:text-sm">
              You must complete an assessment before subscribing to premium features. 
              <div className="mt-2 space-y-2">
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-amber-700 underline"
                  onClick={() => navigate('/assessment')}
                >
                  Take Assessment Now
                </Button>
                <div className="text-xs text-amber-600">
                  Complete any of our assessments: High-Value Man, Wife Material, or Bridal Price Estimator
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {assessmentId && (
          <Alert className="max-w-xl mx-auto bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 text-sm sm:text-base">Assessment Completed!</AlertTitle>
            <AlertDescription className="text-green-700 text-xs sm:text-sm">
              Great! You've completed an assessment and can now subscribe to premium features.
            </AlertDescription>
          </Alert>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.id} className={`border-2 ${plan.popular ? 'border-[#FF158A] shadow-xl' : 'border-gray-200'} relative hover:shadow-lg transition-all h-full`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-[#FF158A] text-white px-2 sm:px-3 py-1 text-xs sm:text-sm">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-3 sm:pb-4 px-3 sm:px-6">
              <CardTitle className="text-lg sm:text-xl font-bold text-[#1B1B1B]">{plan.name}</CardTitle>
              <div className="text-center">
                <span className="text-xl sm:text-2xl font-bold text-[#1B1B1B]">£{plan.price}</span>
                <span className="text-[#5F6368] text-xs sm:text-sm"> / {plan.interval}</span>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              <ul className="space-y-2 sm:space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-2 sm:space-x-3">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF158A] mt-0.5 flex-shrink-0" />
                    <span className="text-[#5F6368] text-xs sm:text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full mt-4 sm:mt-6 py-2 sm:py-3 text-sm sm:text-base ${plan.popular ? 'bg-[#FF158A] hover:bg-[#E0147A]' : 'bg-[#5A3DFF] hover:bg-[#4A2DEF]'} text-white`}
                onClick={() => handleSubscribe(plan.id, plan.priceId)}
                disabled={processingPayment === plan.id || !assessmentId}
              >
                {processingPayment === plan.id ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />Processing...</>
                ) : !assessmentId ? 'Complete Assessment First' : `Subscribe ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center mt-6 sm:mt-8">
        <p className="text-xs sm:text-sm text-[#5F6368] mb-4 px-2">
          All plans include a 7-day money-back guarantee. Cancel anytime.
        </p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border-gray-300 text-[#1B1B1B] hover:bg-gray-50"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}