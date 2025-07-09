import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { TooltipWrapper } from '@/components/TooltipWrapper';

interface DelusionalScoreHeaderProps {
  score: number;
  status: 'self-aware' | 'blind-spot' | 'delusional';
  assessmentCount: number;
}

export function DelusionalScoreHeader({ score, status, assessmentCount }: DelusionalScoreHeaderProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'self-aware':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          color: 'text-green-600',
          label: 'Self-Aware',
          description: 'Your self-perception closely aligns with how others see you',
          progressColor: 'bg-green-500'
        };
      case 'blind-spot':
        return {
          icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
          color: 'text-amber-600',
          label: 'Blind Spots',
          description: 'You have some misalignment between self-perception and external perception',
          progressColor: 'bg-amber-500'
        };
      case 'delusional':
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          color: 'text-red-600',
          label: 'Delusional Zone',
          description: 'Significant disparity between how you see yourself and how others see you',
          progressColor: 'bg-red-500'
        };
      default:
        return {
          icon: <Info className="h-8 w-8 text-blue-500" />,
          color: 'text-blue-600',
          label: 'Unknown',
          description: 'We couldn\'t determine your self-awareness status',
          progressColor: 'bg-blue-500'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="text-center mb-8">
      <h1 
        className="text-4xl font-bold mb-4"
        style={{ 
          background: 'linear-gradient(90deg, #ff0099, #9900ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        Self-Awareness Score
      </h1>
      
      <Card className="max-w-sm mx-auto mb-6">
        <CardContent className="p-6 relative">
          <div className="flex flex-col items-center py-4">
            {statusInfo.icon}
            
            <div className="text-4xl font-bold mt-4">
              {score.toFixed(1)}%
            </div>
            
            <div className={`text-lg font-semibold mt-1 ${statusInfo.color}`}>
              {statusInfo.label}
            </div>
            
            <div className="mt-4 w-full">
              <TooltipWrapper content="Lower scores indicate better self-awareness">
                <Progress 
                  value={score} 
                  className="h-3"
                  indicatorClassName={statusInfo.progressColor}
                />
              </TooltipWrapper>
            </div>
            
            <p className="text-sm text-muted-foreground mt-3">
              {statusInfo.description}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-sm text-muted-foreground">
        Based on feedback from {assessmentCount} {assessmentCount === 1 ? 'assessor' : 'assessors'}
      </p>
    </div>
  );
}