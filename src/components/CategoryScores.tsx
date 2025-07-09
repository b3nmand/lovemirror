import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CategoryScore } from '@/lib/scores';
import { CATEGORIES } from '@/lib/questions';

interface CategoryScoresProps {
  scores: CategoryScore[];
}

export function CategoryScores({ scores }: CategoryScoresProps) {
  // Ensure scores is defined and not empty
  if (!scores || scores.length === 0) {
    return (
      <div className="text-center my-6 text-muted-foreground">
        No category scores available.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-8">
      {scores.map((category) => {
        const categoryInfo = CATEGORIES[category.category] || {
          color: 'bg-gray-500',
          description: 'Category description',
          gradient: 'from-gray-500 to-gray-600'
        };
        
        return (
          <Card key={category.category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span 
                  className={`w-3 h-3 rounded-full ${categoryInfo?.color || 'bg-gray-500'}`}
                />
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress 
                  value={category.percentage} 
                  className={`h-2 ${categoryInfo?.gradient ? `bg-gradient-to-r ${categoryInfo.gradient}` : ''}`}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Score: {category.percentage.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">
                    Weight: {category.weight}x
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {categoryInfo?.description || 'How you perform in this category'}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}