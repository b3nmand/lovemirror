import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';

export default function SubscriptionPlansPage() {
  const navigate = useNavigate();
  
  return (
    <div className="container max-w-5xl mx-auto p-6 pb-16">
      <div className="mb-8 flex items-center">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold" style={{ 
          background: 'linear-gradient(90deg, #ff0099, #9900ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Subscription Plans
        </h1>
      </div>
      
      <Card className="bg-white shadow-md border-none mb-8">
        <CardContent className="p-8">
          <SubscriptionPlans />
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-r from-pink-50/80 to-purple-50/80 shadow-md border-none">
        <CardContent className="p-6">
          <div className="md:flex items-start">
            <div className="md:w-1/2 md:pr-8 mb-6 md:mb-0">
              <h3 className="text-xl font-semibold mb-4">Why Subscribe to Love Mirror Premium?</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">1</span>
                  <span><strong>Advanced Insights</strong> - Get deeper analysis of your relationship patterns and compatibility factors</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">2</span>
                  <span><strong>Unlimited Assessments</strong> - Gather feedback from more people in your life for the most accurate results</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">3</span>
                  <span><strong>Premium Content</strong> - Access expert-created articles, guides and personalized improvement plans</span>
                </li>
              </ul>
            </div>
            
            <div className="md:w-1/2 md:pl-8 md:border-l">
              <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Can I cancel anytime?</h4>
                  <p className="text-sm text-muted-foreground">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.</p>
                </div>
                <div>
                  <h4 className="font-medium">Is my payment information secure?</h4>
                  <p className="text-sm text-muted-foreground">Yes, we use Stripe for payment processing. Your payment details are never stored on our servers.</p>
                </div>
                <div>
                  <h4 className="font-medium">What's included in the Couples plan?</h4>
                  <p className="text-sm text-muted-foreground">The Couples plan includes accounts for both partners, shared relationship dashboard, and premium features for relationship development.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}