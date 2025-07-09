import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionBannerProps {
  className?: string;
}

export function SubscriptionBanner({ className = '' }: SubscriptionBannerProps) {
  const navigate = useNavigate();
  const { isSubscribed, loading } = useSubscription();
  
  if (loading || isSubscribed) {
    return null;
  }
  
  return (
    <div className={`bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-pink-200 py-2 px-4 ${className}`}>
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center mb-2 sm:mb-0">
          <Sparkles className="h-4 w-4 text-pink-500 mr-2" />
          <span className="text-sm">
            Unlock all premium features with a subscription
          </span>
        </div>
        <Button
          size="sm"
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-xs text-white [&_svg]:text-white"
          onClick={() => navigate('/subscription')}
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}