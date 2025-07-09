import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Crown, Diamond, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';

export default function SubscribePrompt() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get assessment type and ID from URL parameters
  const assessmentType = searchParams.get('assessmentType');
  const assessmentId = searchParams.get('assessmentId');
  
  // Determine the title and icon based on assessment type
  let title = 'Unlock Full Results';
  let Icon = Crown;
  
  if (assessmentType) {
    switch (assessmentType) {
      case 'high-value-man':
        title = 'Unlock Your High-Value Man Results';
        Icon = Scale;
        break;
      case 'wife-material':
        title = 'Unlock Your Wife Material Results';
        Icon = Diamond;
        break;
      case 'bridal-price':
        title = 'Unlock Your Bridal Price Results';
        Icon = Crown;
        break;
      default:
        title = 'Unlock Your Full Results';
    }
  }
  
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
          {title}
        </h1>
      </div>
      
      <Card className="bg-gradient-to-r from-pink-50/80 to-purple-50/80 shadow-md border-none mb-8">
        <CardHeader className="text-center pb-2">
          <Icon className="h-12 w-12 mx-auto mb-2 text-pink-500" />
          <CardTitle className="text-2xl">Your Assessment Results Are Ready!</CardTitle>
          <CardDescription className="text-base">
            Subscribe now to unlock your complete assessment results and premium features
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Alert className="bg-blue-50 border-blue-100 mb-6">
            <AlertDescription className="text-blue-800">
              You've completed your assessment. Choose a subscription plan to view your comprehensive results and gain access to all premium features.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-pink-100">
              <h3 className="font-semibold text-lg mb-2">You'll get immediate access to:</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">1</span>
                  <span>Your complete {assessmentType?.replace(/-/g, ' ')} assessment results</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">2</span>
                  <span>Detailed category breakdowns and improvement suggestions</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">3</span>
                  <span>Advanced analytics and personalized insights</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">4</span>
                  <span>All premium features across the platform</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-md border-none mb-8">
        <CardContent className="p-8">
          <SubscriptionPlans assessmentType={assessmentType} assessmentId={assessmentId} />
        </CardContent>
      </Card>
    </div>
  );
}