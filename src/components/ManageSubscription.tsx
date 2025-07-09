import React, { useState } from 'react';
import { CreditCard, Calendar, Clock, CheckCircle, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createCustomerPortalSession, cancelSubscription } from '@/lib/stripe';
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  plan: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

interface ManageSubscriptionProps {
  subscription: Subscription | null;
  onUpdateSubscription: () => void;
}

export function ManageSubscription({ subscription, onUpdateSubscription }: ManageSubscriptionProps) {
  const [loading, setLoading] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  
  // Demo implementation with fixed subscription data
  const demoSubscription: Subscription = subscription || {
    id: 'sub_demo123456',
    status: 'active',
    plan: 'premium',
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    cancel_at_period_end: false,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
  };

  const formatPlanName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1).replace(/_/g, ' ');
  };
  
  const handleManageBilling = async () => {
    try {
      setLoading(true);
      
      // Demo implementation - no actual redirect
      toast.info("This is a demo - in a real implementation, you would be redirected to the Stripe Customer Portal", {
        duration: 5000,
      });
      
      setTimeout(() => {
        setLoading(false);
      }, 2000);
      
      // In production, this would redirect to Stripe portal
      // await createCustomerPortalSession(window.location.origin + '/settings?tab=subscription');
    } catch (error) {
      console.error('Error managing subscription:', error);
      toast.error('Failed to open customer portal');
      setLoading(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      
      // Demo implementation
      toast.info("This is a demo - your subscription would be canceled at the end of the billing period", {
        duration: 5000,
      });
      
      // Simulate API call
      setTimeout(() => {
        setCancelDialog(false);
        
        // Update the subscription status
        demoSubscription.cancel_at_period_end = true;
        onUpdateSubscription();
        
        setLoading(false);
        toast.success("Subscription will cancel at end of billing period");
      }, 2000);
      
      // In production, this would call the API
      // const { success, error } = await cancelSubscription();
      // if (!success) throw error;
      
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
      setLoading(false);
      setCancelDialog(false);
    }
  };
  
  const handleResumeSubscription = async () => {
    try {
      setLoading(true);
      
      // Demo implementation
      toast.info("This is a demo - your subscription would be resumed", {
        duration: 5000,
      });
      
      // Simulate API call
      setTimeout(() => {
        // Update the subscription status
        demoSubscription.cancel_at_period_end = false;
        onUpdateSubscription();
        
        setLoading(false);
        toast.success("Subscription resumed successfully");
      }, 2000);
      
      // In production, this would call the API
      // await resumeSubscription();
      
    } catch (error) {
      console.error('Error resuming subscription:', error);
      toast.error('Failed to resume subscription');
      setLoading(false);
    }
  };

  if (!demoSubscription) {
    return (
      <div className="text-center py-8">
        <p>No subscription information found.</p>
        <Button 
          onClick={() => window.location.href = '/subscription-plans'}
          className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
        >
          View Subscription Plans
        </Button>
      </div>
    );
  }

  const isActive = demoSubscription.status === 'active';
  const isCanceling = demoSubscription.cancel_at_period_end;
  const endDate = new Date(demoSubscription.current_period_end);
  const startDate = new Date(demoSubscription.created_at);
  
  // Calculate days remaining in subscription
  const daysRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className="space-y-6">
      <Card className="border-pink-100 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Manage your plan and billing</CardDescription>
            </div>
            <Badge className={
              isActive 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-amber-100 text-amber-800 border-amber-200"
            }>
              {isActive ? "Active" : demoSubscription.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-gradient-to-r from-pink-50/80 to-purple-50/80 p-4 border border-pink-100">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-semibold text-lg">{formatPlanName(demoSubscription.plan)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renewal Date</p>
                <p className="font-semibold flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-pink-600" />
                  {endDate.toLocaleDateString()}
                  {daysRemaining > 0 && <span className="text-xs ml-2 text-muted-foreground">({daysRemaining} days)</span>}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscription Started</p>
                <p className="font-semibold flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-pink-600" />
                  {startDate.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {isCanceling && (
            <Alert className="bg-amber-50 border-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Subscription Cancellation Scheduled</AlertTitle>
              <AlertDescription className="text-amber-800">
                Your subscription will end on {endDate.toLocaleDateString()}. You'll still have access to premium features until then.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Plan Includes</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {demoSubscription.plan === 'premium' && (
                <>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Advanced compatibility analysis</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Unlimited external assessors</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Premium educational content</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>AI relationship coach</span>
                  </div>
                </>
              )}
              
              {demoSubscription.plan === 'basic' && (
                <>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Self-assessment tools</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Basic compatibility analysis</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Up to 3 external assessors</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Standard educational content</span>
                  </div>
                </>
              )}
              
              {demoSubscription.plan === 'couples' && (
                <>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Accounts for both partners</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Advanced compatibility analysis</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Couples therapy resources</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Video consultation (1/month)</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Billing History</h3>
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-3 bg-muted p-3 text-sm font-medium">
                <div>Date</div>
                <div>Amount</div>
                <div>Status</div>
              </div>
              <div className="grid grid-cols-3 p-3 text-sm border-t">
                <div>{startDate.toLocaleDateString()}</div>
                <div>
                  {demoSubscription.plan === 'premium' 
                    ? '$19.99' 
                    : demoSubscription.plan === 'basic' 
                      ? '$9.99' 
                      : '$29.99'}
                </div>
                <div>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    Paid
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex flex-wrap gap-3 justify-between">
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Manage Billing
          </Button>

          {isCanceling ? (
            <Button
              onClick={handleResumeSubscription}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Resume Subscription
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setCancelDialog(true)}
              disabled={loading}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              Cancel Subscription
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Want to Upgrade?</CardTitle>
          <CardDescription>
            Take your relationship experience to the next level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white" 
            onClick={() => window.location.href = '/subscription-plans'}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Subscription Plans
          </Button>
        </CardContent>
      </Card>
      
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access to premium features until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert className="bg-amber-50 border-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Your subscription will end on {endDate.toLocaleDateString()}. After this date, you'll lose access to premium features.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog(false)}
              disabled={loading}
            >
              Keep Subscription
            </Button>
            <Button
              onClick={handleCancelSubscription}
              disabled={loading}
              variant="destructive"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Yes, Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}