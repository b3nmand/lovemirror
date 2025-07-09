import React, { useState } from 'react';
import { Check, Loader2, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createCheckoutSession } from '@/lib/stripeCheckout';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  priceId: string;
  features: string[];
  popular?: boolean;
  description: string;
  duration: number;
}

interface SubscriptionPlansProps {
  user: { id: string };
  plans: Plan[];
  assessmentId?: string;
  assessmentType?: string;
}

export function SubscriptionPlans({ user, plans, assessmentId, assessmentType }: SubscriptionPlansProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    setLoadingPlan(plan.id);
    try {
      await createCheckoutSession({
        userId: user.id,
        priceId: plan.priceId,
        planId: plan.id,
        assessmentId,
      });
    } catch (err) {
      // Optionally show error toast
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Unlock premium features and take your relationship journey to the next level
        </p>
      </div>
      
      <Alert className="bg-blue-50 border-blue-100">
        <AlertDescription className="text-blue-800">
          <strong>Demo Mode:</strong> This is a demo implementation. No real charges will be made.
        </AlertDescription>
      </Alert>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`flex flex-col h-full relative transition-all ${
              plan.popular 
                ? "border-pink-200 shadow-lg" 
                : "border-gray-200 hover:border-pink-100 hover:shadow-md"
            }`}
          >
            {plan.id === '3_months' && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className={`pb-8 ${plan.popular ? "pt-8" : "pt-6"}`}>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-2">
                <span className="text-3xl font-bold">£{plan.price}</span>
                <span className="text-muted-foreground">
                  {plan.interval === 'month' && plan.duration > 1 
                    ? ` total` 
                    : `/${plan.interval}`}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan === plan.id}
                className={`w-full ${
                  plan.popular 
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white" 
                    : ""
                }`}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Subscribe
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}