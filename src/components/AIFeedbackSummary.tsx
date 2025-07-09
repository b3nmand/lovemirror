import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Brain } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { CategoryGap } from '@/lib/delusionalScore';
import { getDelusionalFeedback, getOverallDelusionalFeedback } from '@/lib/delusionalScore';

interface AIFeedbackSummaryProps {
  categoryGaps: CategoryGap[];
  overallScore: number;
}

export function AIFeedbackSummary({ categoryGaps, overallScore }: AIFeedbackSummaryProps) {
  // Sort categories by gap size (largest to smallest)
  const sortedCategories = [...categoryGaps].sort((a, b) => b.gap - a.gap);
  
  // Get the top 2 categories with the largest gaps
  const topGapCategories = sortedCategories.slice(0, 2);
  
  // Get overall feedback
  const overallFeedback = getOverallDelusionalFeedback(overallScore);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Feedback Summary
        </CardTitle>
        <CardDescription>
          Personalized insights based on your self-awareness gaps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-sm">{overallFeedback}</p>
        </div>

        <Separator />

        <div className="space-y-4">
          {topGapCategories.map((category) => (
            <div key={category.category} className="space-y-2">
              <h3 className="text-md font-semibold flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                {category.category}
              </h3>
              <p className="text-sm pl-6">
                {getDelusionalFeedback(
                  category.category,
                  category.gap,
                  category.self_score,
                  category.external_score
                )}
              </p>
            </div>
          ))}

          {categoryGaps.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p>No feedback available yet. Complete more external assessments for personalized insights.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}