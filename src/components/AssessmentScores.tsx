import { CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React from 'react';

export function AssessmentScores() {
  const [scores, setScores] = React.useState<{
    category: string;
    score: number;
    color: string;
  }[]>([
    { category: 'Mental', score: 85, color: 'bg-indigo-500' },
    { category: 'Emotional', score: 75, color: 'bg-pink-500' },
    { category: 'Physical', score: 90, color: 'bg-emerald-500' },
    { category: 'Financial', score: 70, color: 'bg-amber-500' },
  ]);

  return (
    <CardContent className="p-4 space-y-4 bg-gradient-to-r from-gray-50 to-pink-50/20">
      {scores.map((score) => (
        <div key={score.category} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-1.5 ${score.color}`}></span>
              {score.category}
            </span>
            <span className="font-medium">{score.score}%</span>
          </div>
          <Progress 
            value={score.score} 
            className={`h-2 ${score.color}`} 
            indicatorClassName="transition-all duration-500 ease-in-out"
          />
        </div>
      ))}
    </CardContent>
  );
}