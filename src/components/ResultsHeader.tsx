import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ResultsHeaderProps {
  title: string;
  score: number;
  badge: string;
  subtitle?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export function ResultsHeader({
  title,
  score,
  badge,
  subtitle,
  gradientFrom = 'from-pink-500',
  gradientTo = 'to-purple-600'
}: ResultsHeaderProps) {
  const handleShare = () => {
    // TODO: Implement sharing functionality
    console.log('Share results');
  };

  return (
    <div className="text-center mb-8">
      <h1 
        className="text-4xl font-bold mb-4"
        style={{ 
          background: `linear-gradient(90deg, var(--${gradientFrom.split('-')[1]}-500), var(--${gradientTo.split('-')[1]}-600))`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        {title}
      </h1>
      
      <Card className="max-w-sm mx-auto mb-6 overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-8 w-8"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {score.toFixed(1)}%
            </div>
            <div className={`text-lg font-semibold bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}>
              {badge}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <p className="text-sm text-muted-foreground">
        Results generated on {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}