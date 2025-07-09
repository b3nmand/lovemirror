import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Category } from '@/lib/questions';

interface CategoryProgressProps {
  categories: Category[];
  currentCategoryIndex: number;
  questionsAnsweredByCategory: Record<string, number>;
  totalQuestionsByCategory: Record<string, number>;
  onSelectCategory: (index: number) => void;
}

export function CategoryProgress({
  categories,
  currentCategoryIndex,
  questionsAnsweredByCategory,
  totalQuestionsByCategory,
  onSelectCategory
}: CategoryProgressProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex flex-wrap justify-between gap-2 mb-4">
        {categories.map((category, index) => {
          const answered = questionsAnsweredByCategory[category.name] || 0;
          const total = totalQuestionsByCategory[category.name] || 0;
          const progress = total > 0 ? (answered / total) * 100 : 0;
          
          return (
            <Button
              key={category.name}
              variant="ghost"
              className={cn(
                "flex flex-col items-center p-2 gap-1 h-auto transition-all",
                currentCategoryIndex === index ? "border-b-2 bg-secondary" : "",
                answered === total && total > 0 ? "opacity-100" : "opacity-80"
              )}
              onClick={() => onSelectCategory(index)}
            >
              <span className={cn(
                "w-3 h-3 rounded-full",
                category.color
              )}></span>
              <span className="text-xs text-center line-clamp-2">{category.name}</span>
              <span className="text-xs">{answered}/{total}</span>
            </Button>
          );
        })}
      </div>
      <Progress value={calculateOverallProgress(questionsAnsweredByCategory, totalQuestionsByCategory)} className="h-2 mt-2" />
    </div>
  );
}

function calculateOverallProgress(
  answered: Record<string, number>,
  total: Record<string, number>
): number {
  const totalAnswered = Object.values(answered).reduce((sum, count) => sum + count, 0);
  const totalQuestions = Object.values(total).reduce((sum, count) => sum + count, 0);
  
  return totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;
}