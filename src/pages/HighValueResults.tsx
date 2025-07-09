import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ResultsHeader } from '@/components/ResultsHeader';
import { CategoryScores } from '@/components/CategoryScores';
import { ImprovementSuggestions } from '@/components/ImprovementSuggestions';
import { AssessmentResult, generateSuggestions, getBadgeForScore } from '@/lib/scores';
import { getAssessmentById } from '@/lib/supabase';

export default function HighValueResults() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssessment() {
      try {
        // If we have a stored result and no ID, use that
        if (!id) {
          const storedResult = sessionStorage.getItem('assessmentResult');
          if (storedResult) {
            setResult(JSON.parse(storedResult));
            setLoading(false);
            return;
          }
          navigate('/assessment');
          return;
        }

        // Otherwise fetch the assessment by ID
        const { data, error } = await getAssessmentById(id);
        if (error) throw error;

        if (!data) {
          navigate('/assessment');
          return;
        }

        // Transform the data into AssessmentResult format
        setResult({
          categoryScores: data.category_scores,
          overallScore: data.overall_score,
          overallPercentage: data.overall_percentage,
          lowestCategories: data.category_scores
            .sort((a: any, b: any) => a.percentage - b.percentage)
            .slice(0, 2),
          assessmentType: data.assessment_type,
          badge: getBadgeForScore(data.overall_percentage, data.assessment_type)
        });

      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError('Failed to load assessment results');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAssessment();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 mt-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 mt-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
            <Button
              onClick={() => navigate('/assessment')}
              className="mt-4"
            >
              Take New Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) return null;

  const suggestions = generateSuggestions(result.lowestCategories);

  return (
    <div className="container mx-auto p-4 pb-16">
      <ResultsHeader
        title="Your High-Value Assessment Results"
        score={result.overallPercentage}
        badge={result.badge}
        subtitle="You're on your way to becoming a high-value man"
        gradientFrom="from-blue-500"
        gradientTo="to-purple-500"
      />

      <CategoryScores scores={result.categoryScores} />

      <ImprovementSuggestions suggestions={suggestions} />

      <div className="flex justify-center">
        <Button
          onClick={() => navigate('/')}
          className="bg-white text-gray-900 border border-gray-200 hover:text-purple-600 hover:border-pink-300 focus:border-2 focus:border-pink-500 focus:text-pink-700 transition-all"
        >
          Return Home
        </Button>
      </div>
    </div>
  );
}