import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SubscriptionStatusProps {
  showDetails?: boolean;
}

export function SubscriptionStatus({ showDetails = false }: SubscriptionStatusProps) {
  const { isSubscribed, subscription, loading, error } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">Checking subscription...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center text-destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <span className="text-sm">Error checking subscription</span>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="flex items-center">
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          Free Plan
        </Badge>
      </div>
    );
  }

  if (showDetails && subscription) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {subscription.plan_id === 'price_lifetime' ? 'Lifetime' : 'Active Subscription'}
          </Badge>
        </div>
        {subscription.plan_id !== 'price_lifetime' && (
          <div className="text-xs text-muted-foreground mt-1">
            Renews: {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Premium
      </Badge>
    </div>
  );
}