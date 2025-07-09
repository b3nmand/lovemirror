import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Suggestion {
  title: string;
  action: string;
  timeline: string;
}

interface ImprovementSuggestionsProps {
  suggestions: Suggestion[];
}

export function ImprovementSuggestions({ suggestions }: ImprovementSuggestionsProps) {
  const navigate = useNavigate();

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Suggested Improvements</CardTitle>
        <Button
          variant="ghost"
          className="text-sm"
          onClick={() => navigate('/goals')}
        >
          View Full Plan
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">{suggestion.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">{suggestion.action}</p>
                <p className="text-sm text-muted-foreground">
                  Timeline: {suggestion.timeline}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}