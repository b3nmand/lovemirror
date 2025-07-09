import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getAssessorByCode, completeAssessment, getAssessmentTypeName } from '@/lib/assessors';
import { submitExternalAssessment } from '@/lib/externalAssessments';
import { AssessmentQuestion } from '@/components/AssessmentQuestion';
import { getQuestionsByType, CATEGORIES } from '@/lib/questions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Profile } from '@/types/profile';
import { calculateScores, calculateBridalPrice } from '@/lib/scores';

export default function ExternalAssessment() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [assessor, setAssessor] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<'intro' | 'assessment' | 'feedback' | 'complete'>('intro');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [bridalPrice, setBridalPrice] = useState<any>(null);
  
  // For the assessment
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchAssessor() {
      if (!code) {
        setError('Invalid invitation code');
        setLoading(false);
        return;
      }

      try {
        const { data, error, userProfile } = await getAssessorByCode(code);
        
        if (error || !data) {
          setError('Invalid or expired invitation');
          setLoading(false);
          return;
        }

        if (data.status === 'completed') {
          setError('This assessment has already been completed');
          setLoading(false);
          return;
        }

        setAssessor(data);
        setUserProfile(userProfile || null);
        
        // Get questions for this assessment type
        if (data.assessment_type) {
          const assessmentQuestions = getQuestionsByType(data.assessment_type);
          
          // Modify questions for external assessment context
          const modifiedQuestions = assessmentQuestions.map(q => ({
            ...q,
            text: q.text.replace(
              /^I /i, 
              `${userProfile?.name || 'This person'} `
            ).replace(
              /\bmy\b/gi, 
              'their'
            )
          }));
          
          setQuestions(modifiedQuestions);
        }
        
      } catch (err) {
        console.error('Error fetching assessor:', err);
        setError('Failed to load assessment details');
      } finally {
        setLoading(false);
      }
    }

    fetchAssessor();
  }, [code]);

  const handleStartAssessment = () => {
    setCurrentStep('assessment');
  };

  const handleResponse = (score: number) => {
    if (!currentQuestion) return;
    
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: score
    }));
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleContinueToFeedback = () => {
    setCurrentStep('feedback');
  };

  const handleCompleteAssessment = async () => {
    if (!assessor || !assessor.assessment_type) return;

    try {
      setSubmitting(true);
      
      // Format responses for score calculation
      const formattedResponses = questions.map(q => ({
        questionId: q.id,
        category: q.category,
        score: responses[q.id]
      }));
      
      // Calculate the scores (for display in the results page)
      const result = calculateScores(formattedResponses, assessor.assessment_type);
      setAssessmentResult(result);
      
      // If this is a bridal price assessment, also calculate the bridal price
      if (assessor.assessment_type === 'bridal-price' && userProfile) {
        // Use a default region or get it from the userProfile if available
        const region = userProfile.region || 'africa';
        const bridalPriceResult = calculateBridalPrice(
          result.categoryScores,
          10000, // Default base value
          region
        );
        setBridalPrice(bridalPriceResult);
      }
      
      // Submit to database
      const { success, error } = await submitExternalAssessment(
        assessor.id,
        assessor.user_id,
        assessor.assessment_type,
        formattedResponses,
        feedback
      );
      
      if (!success) {
        throw error;
      }
      
      // Update assessor status to completed
      const { success: statusSuccess, error: statusError } = await completeAssessment(assessor.id);
      
      if (!statusSuccess) {
        throw statusError;
      }

      setCurrentStep('complete');
      setSuccess(true);
    } catch (err) {
      console.error('Error completing assessment:', err);
      setError('Failed to complete assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate progress
  const answeredQuestions = Object.keys(responses).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  
  // Get current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // All questions answered?
  const allQuestionsAnswered = questions.every(q => responses[q.id] !== undefined);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-sm sm:text-base">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Assessment Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="text-sm sm:text-base">{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full text-white text-sm sm:text-base"
              onClick={() => navigate('/')}
            >
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (currentStep === 'complete' || success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Assessment Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-4 sm:py-6">
              <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mb-4" />
              <p className="text-center mb-4 sm:mb-6 text-sm sm:text-base">
                Thank you for completing this assessment. Your feedback is valuable and will help {userProfile?.name || 'the person'} gain insights into how others perceive them.
              </p>
              
              {assessmentResult && assessor.assessment_type === 'bridal-price' && bridalPrice && (
                <div className="w-full">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">Bridal Price Estimate</h3>
                  <div className="bg-red-50 p-3 sm:p-4 rounded-lg mb-4">
                    <div className="text-2xl sm:text-3xl font-bold text-center mb-2">
                      {bridalPrice.formattedPrice}
                    </div>
                    <p className="text-xs sm:text-sm text-center text-muted-foreground">
                      Based on your assessment, this is the estimated bridal price for {userProfile?.name || 'this person'}.
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-center text-xs sm:text-sm text-muted-foreground">
                Your assessment has been submitted anonymously.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm sm:text-base"
              onClick={() => navigate('/')}
            >
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (currentStep === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">
              {getAssessmentTypeName(assessor?.assessment_type)}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              You've been invited to provide an external assessment of {userProfile?.name || 'someone you know'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base">
              {userProfile?.name || 'Someone'} has asked for your honest assessment of their qualities 
              and characteristics. Your feedback will help them gain valuable insights about how 
              others perceive them.
            </p>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base">
              This assessment contains {questions.length} questions across several categories. Please 
              answer each question honestly based on your observations and interactions with {userProfile?.name || 'this person'}.
            </p>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base">
              <strong>Your responses will be anonymous</strong> and only the overall results will be shared with them.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStartAssessment}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm sm:text-base"
            >
              Start Assessment
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (currentStep === 'feedback') {
    return (
      <div className="container mx-auto p-4 pb-16 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ 
            background: 'linear-gradient(90deg, #ff0099, #9900ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Additional Feedback
          </h1>
          <p className="text-muted-foreground mt-2">
            Share any additional thoughts or observations (Optional)
          </p>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Share your insights</CardTitle>
            <CardDescription>
              Is there anything else you'd like to share about {userProfile?.name || 'this person'}?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feedback">Additional feedback (optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Share your thoughts here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('assessment')}>
              Back to Questions
            </Button>
            <Button 
              onClick={handleCompleteAssessment}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Complete Assessment'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 pb-16">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ 
          background: 'linear-gradient(90deg, #ff0099, #9900ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {getAssessmentTypeName(assessor?.assessment_type)}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Provide honest feedback about {userProfile?.name || 'this person'}
        </p>
      </div>
      
      {currentQuestion && (
        <div className="mb-6 sm:mb-8">
          <AssessmentQuestion
            question={currentQuestion}
            currentResponse={responses[currentQuestion.id] || null}
            onResponse={handleResponse}
            categoryColor={CATEGORIES[currentQuestion.category]?.color || 'bg-gray-500'}
          />
        </div>
      )}
      
      <div className="flex justify-between mt-6 sm:mt-8">
        <Button
          variant="outline"
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="text-sm sm:text-base"
        >
          Previous
        </Button>
        
        {currentQuestionIndex < questions.length - 1 ? (
          <Button 
            onClick={goToNextQuestion}
            disabled={!responses[currentQuestion?.id]}
            className={`bg-gradient-to-r ${CATEGORIES[currentQuestion?.category]?.gradient || ''} text-white text-sm sm:text-base`}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleCompleteAssessment}
            disabled={!allQuestionsAnswered}
            className={`bg-gradient-to-r ${CATEGORIES[currentQuestion?.category]?.gradient || ''} text-white text-sm sm:text-base`}
          >
            Complete
          </Button>
        )}
      </div>
      
      <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground">
        <p>Progress: {answeredQuestions} of {totalQuestions} questions answered</p>
        <Progress value={progress} className="h-2 mt-2" />
      </div>
    </div>
  );
}