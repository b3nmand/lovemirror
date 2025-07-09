import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getAssessorForAssessment } from '@/lib/externalAssessments';
import { CATEGORIES } from '@/lib/questions';
import { getBadgeForScore } from '@/lib/scores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import type { ExternalAssessmentResult } from '@/lib/externalAssessments';

interface ExternalAssessmentDetailsProps {
  assessment: ExternalAssessmentResult;
  onBack: () => void;
}

export function ExternalAssessmentDetails({ assessment, onBack }: ExternalAssessmentDetailsProps) {
  const [assessorInfo, setAssessorInfo] = useState<{ relationship: string; email: string | null }>({
    relationship: '',
    email: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssessorInfo() {
      try {
        setLoading(true);
        const { relationship, email, error } = await getAssessorForAssessment(assessment.assessor_id);
        
        if (!error) {
          setAssessorInfo({ relationship, email });
        }
      } catch (err) {
        console.error('Error fetching assessor info:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssessorInfo();
  }, [assessment.assessor_id]);

  const badge = getBadgeForScore(assessment.overall_percentage, assessment.assessment_type);
  const completedDate = format(new Date(assessment.completed_at), 'PPP');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results List
        </Button>
        <Badge variant="outline" className="capitalize">
          {assessorInfo.relationship || 'Loading...'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Results</CardTitle>
          <CardDescription>
            Completed on {completedDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center mb-6">
            <div className="text-5xl font-bold mb-2">
              {Math.round(assessment.overall_percentage)}%
            </div>
            <div className="text-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              {badge}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {assessment.category_scores.map((category) => {
          const categoryInfo = CATEGORIES[category.category] || {
            color: 'bg-gray-500',
            description: 'How you perform in this category',
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
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {assessment.feedback && (
        <Card>
          <CardHeader>
            <CardTitle>Delusional Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{assessment.feedback}</p>
          </CardContent>
        </Card>
      )}

      <Button 
        onClick={onBack}
        variant="outline"
        className="w-full"
      >
        Back to Results List
      </Button>
    </div>
  );
}