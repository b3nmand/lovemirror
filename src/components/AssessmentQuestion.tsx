import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Question } from '@/lib/questions';
import { ExternalQuestion } from '@/lib/externalQuestions';
import { cn } from '@/lib/utils';

interface AssessmentQuestionProps {
  question: Question | ExternalQuestion;
  currentResponse: number | null;
  onResponse: (score: number) => void;
  categoryColor: string;
  isExternalAssessment?: boolean;
  onNextQuestion?: () => void;
  onPreviousQuestion?: () => void;
  hasNextQuestion?: boolean;
  hasPreviousQuestion?: boolean;
  isLastQuestionInCategory?: boolean;
}

export function AssessmentQuestion({ 
  question, 
  currentResponse, 
  onResponse,
  categoryColor,
  isExternalAssessment = false,
  onNextQuestion,
  onPreviousQuestion,
  hasNextQuestion,
  hasPreviousQuestion,
  isLastQuestionInCategory
}: AssessmentQuestionProps) {
  const scores = [1, 2, 3, 4, 5];
  
  const getLabelForScore = (score: number) => {
    switch (score) {
      case 1: return 'Rarely';
      case 2: return 'Sometimes';
      case 3: return 'Often';
      case 4: return 'More Often';
      case 5: return 'Always';
      default: return '';
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto transition-all duration-300 hover:shadow-lg">
      <CardHeader className={cn("text-white p-3 sm:p-4 md:p-6", categoryColor)}>
        <CardTitle className="text-base sm:text-lg md:text-xl">{question.category}</CardTitle>
        <CardDescription className="text-white/80 text-xs sm:text-sm">
          {isExternalAssessment 
            ? "Rate how well this statement describes the person you're assessing" 
            : "Rate how well this statement describes you"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6">{question.text}</p>
        <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2 mt-3 sm:mt-4">
          {scores.map((score) => (
            <Button
              key={score}
              variant={currentResponse === score ? "default" : "outline"}
              className={cn(
                "flex-1 transition-all py-2 sm:py-3 text-xs sm:text-sm",
                currentResponse === score ? categoryColor : "",
                currentResponse === score ? "text-white" : "text-gray-700"
              )}
              onClick={() => onResponse(score)}
            >
              <div className="flex flex-col items-center">
                <span className="text-sm sm:text-base md:text-lg font-bold">{score}</span>
                <span className="text-xs sm:text-xs">{getLabelForScore(score)}</span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-3 sm:pt-4 px-3 sm:px-4 md:px-6">
        <div className="text-xs sm:text-sm text-muted-foreground">
          1 = Rarely, 5 = Always
        </div>
        
        {/* Navigation buttons */}
        <div className="flex gap-2">

          
          {hasPreviousQuestion && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousQuestion}
              className="text-xs bg-transparent hover:bg-gray-50 text-gray-700 border-gray-200"
            >
              Previous Question
            </Button>
          )}
          
          {hasNextQuestion && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNextQuestion}
              className="text-xs bg-transparent hover:bg-gray-50 text-gray-700 border-gray-200"
              disabled={!currentResponse}
            >
              Next Question
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}