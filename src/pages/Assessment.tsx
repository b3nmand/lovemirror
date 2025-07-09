import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AssessmentQuestion } from '@/components/AssessmentQuestion';
import { CategoryProgress } from '@/components/ui/CategoryProgress';
import { 
  getAssessmentType, 
  type AssessmentType 
} from '@/lib/assessmentType';
import { 
  Question, 
  CATEGORIES, 
  getQuestionsByType, 
  getQuestionsByCategory 
} from '@/lib/questions';
import { 
  calculateScores, 
  type AssessmentResult 
} from '@/lib/scores';
import { supabase, saveAssessmentResults } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';
import type { Profile } from '@/types/profile';
import { Progress } from '@/components/ui/progress';

export default function Assessment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSubscribed } = useSubscription();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assessmentType, setAssessmentType] = useState<AssessmentType | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [questionsAnsweredByCategory, setQuestionsAnsweredByCategory] = useState<Record<string, number>>({});
  const [totalQuestionsByCategory, setTotalQuestionsByCategory] = useState<Record<string, number>>({});
  
  // Get current user and assessment type
  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        setUser(user);

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
        
        const urlType = searchParams.get('type');
        const type = getAssessmentType(profileData, urlType);
        
        if (!type) {
          setError('Could not determine assessment type. Please update your profile.');
          return;
        }
        
        setAssessmentType(type);
        
        // Get questions for this assessment type
        const questions = getQuestionsByType(type);
        setQuestions(questions);

        // Group questions by category
        const questionsByCategory = getQuestionsByCategory(questions);
        
        // Create categories array with color information
        const categoriesArray = Object.keys(questionsByCategory).map(categoryName => ({
          name: categoryName,
          color: CATEGORIES[categoryName]?.color || 'bg-gray-500',
          questions: questionsByCategory[categoryName]
        }));
        
        setCategories(categoriesArray);
        
        // Calculate total questions by category
        const totalsByCategory: Record<string, number> = {};
        categoriesArray.forEach(category => {
          totalsByCategory[category.name] = category.questions.length;
        });
        setTotalQuestionsByCategory(totalsByCategory);

      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load your assessment. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, []);
  
  // Update current question when category changes
  useEffect(() => {
    if (categories.length > 0 && currentCategoryIndex < categories.length) {
      const currentCategory = categories[currentCategoryIndex];
      const answeredQuestionsInCategory = currentCategory.questions.filter(
        (q: Question) => responses[q.id] !== undefined
      ).length;
      
      // If all questions in this category are answered, move to the next category
      if (answeredQuestionsInCategory === currentCategory.questions.length && currentCategoryIndex < categories.length - 1) {
        setCurrentCategoryIndex(currentCategoryIndex + 1);
      }
    }
  }, [responses, currentCategoryIndex, categories]);
  
  // Update answered questions count by category
  useEffect(() => {
    if (categories.length > 0) {
      const answeredByCategory: Record<string, number> = {};
      
      categories.forEach(category => {
        const answeredCount = category.questions.filter(
          (q: Question) => responses[q.id] !== undefined
        ).length;
        
        answeredByCategory[category.name] = answeredCount;
      });
      
      setQuestionsAnsweredByCategory(answeredByCategory);
    }
  }, [responses, categories]);
  
  // Get current question
  const getCurrentQuestion = () => {
    if (categories.length === 0 || currentCategoryIndex >= categories.length) {
      return null;
    }
    
    const currentCategory = categories[currentCategoryIndex];
    const answeredQuestions = currentCategory.questions.filter(
      (q: Question) => responses[q.id] !== undefined
    );
    
    // If all questions in this category are answered, return the last one
    if (answeredQuestions.length === currentCategory.questions.length) {
      return currentCategory.questions[currentCategory.questions.length - 1];
    }
    
    // Find the first unanswered question in this category
    return currentCategory.questions.find(
      (q: Question) => responses[q.id] === undefined
    );
  };
  
  const currentQuestion = getCurrentQuestion();
  const totalQuestions = questions.length;
  
  // Count answered questions
  const answeredQuestions = Object.keys(responses).length;
  
  // All questions answered?
  const allQuestionsAnswered = questions.every(q => responses[q.id] !== undefined);
  
  const handleResponse = (score: number) => {
    if (!currentQuestion) return;
    
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: score
    }));
  };
  
  const handleSelectCategory = (index: number) => {
    setCurrentCategoryIndex(index);
  };
  
  // Handle assessment submission
  const handleSubmit = async () => {
    if (!allQuestionsAnswered) {
      toast.error('Please answer all questions before submitting.');
      return;
    }
    
    if (!user || !assessmentType) {
      toast.error('User information is missing. Please try again.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Format responses for score calculation
      const formattedResponses = Array.isArray(questions) ? questions.map(q => ({
        questionId: q.id,
        category: q.category,
        score: responses[q.id]
      })) : [];
      
      // Calculate scores
      const result: AssessmentResult = calculateScores(formattedResponses, assessmentType);
      
      // Save to Supabase
      const { data, error } = await saveAssessmentResults(
        user.id,
        assessmentType,
        result.categoryScores,
        result.overallScore,
        result.overallPercentage
      );
      
      if (error) {
        throw error;
      }
      
      // Store results in session storage for results page
      sessionStorage.setItem('assessmentResult', JSON.stringify(result));
      
      // Check if user is subscribed before redirecting to results
      if (!isSubscribed) {
        // Store the return URL based on assessment type
        let returnUrl = '/dashboard';
        switch (assessmentType) {
          case 'high-value-man':
            returnUrl = `/high-value-results/${data.id}`;
            break;
          case 'wife-material':
            returnUrl = `/wife-material-results/${data.id}`;
            break;
          case 'bridal-price':
            returnUrl = `/bridal-price-results/${data.id}`;
            break;
        }
        
        // Ensure we only store relative paths
        if (returnUrl.startsWith('/')) {
        localStorage.setItem('subscriptionReturnUrl', returnUrl);
        }
        navigate('/subscription');
        return;
      }
      
      // Redirect to appropriate results page based on assessment type
      switch (assessmentType) {
        case 'high-value-man':
          navigate(`/high-value-results/${data.id}`);
          break;
        case 'wife-material':
          navigate(`/wife-material-results/${data.id}`);
          break;
        case 'bridal-price':
          navigate(`/bridal-price-results/${data.id}`);
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-4 mt-4 sm:mt-8">
        <div className="mb-4 sm:mb-8">
          <Skeleton className="h-8 sm:h-12 w-2/3 mb-2" />
          <Skeleton className="h-4 sm:h-6 w-1/2" />
        </div>
        <Skeleton className="h-6 sm:h-8 w-full mb-3 sm:mb-4" />
        <Skeleton className="h-48 sm:h-64 w-full mb-4 sm:mb-6" />
        <div className="flex justify-between">
          <Skeleton className="h-8 sm:h-10 w-20 sm:w-24" />
          <Skeleton className="h-8 sm:h-10 w-20 sm:w-24" />
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-3 sm:p-4 mt-4 sm:mt-8">
        <Card className="mx-auto max-w-md">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-rose-500 text-sm sm:text-base">Error</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm">{error}</p>
            <Button 
              className="mt-3 sm:mt-4 text-xs sm:text-sm" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const assessmentTitle = assessmentType === 'high-value-man' 
    ? 'High-Value Man Assessment'
    : assessmentType === 'wife-material'
      ? 'Wife Material Assessment'
      : 'Bridal Price Estimator';
  
  const progress = (answeredQuestions / totalQuestions) * 100;
  
  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 pb-16">
      <div className="text-center mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ 
          background: 'linear-gradient(90deg, #ff0099, #9900ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {assessmentTitle}
        </h1>
        <p className="text-muted-foreground mt-2 text-xs sm:text-sm md:text-base">
          Answer honestly to get the most accurate results
        </p>
      </div>
      
      {/* Category Progress */}
      {categories.length > 0 && (
        <div className="mb-4 sm:mb-6 md:mb-8">
          <CategoryProgress
            categories={categories}
            currentCategoryIndex={currentCategoryIndex}
            questionsAnsweredByCategory={questionsAnsweredByCategory}
            totalQuestionsByCategory={totalQuestionsByCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>
      )}
      
      {currentQuestion && (
        <div className="mb-4 sm:mb-6 md:mb-8">
          <AssessmentQuestion
            question={currentQuestion}
            currentResponse={responses[currentQuestion.id] || null}
            onResponse={handleResponse}
            categoryColor={CATEGORIES[currentQuestion.category]?.color || 'bg-gray-500'}
          />
        </div>
      )}
      
      <div className="flex justify-between mt-4 sm:mt-6 md:mt-8">
        <Button
          variant="outline"
          onClick={() => {
            // Go to previous category if at the beginning of current category
            if (currentCategoryIndex > 0) {
              setCurrentCategoryIndex(currentCategoryIndex - 1);
            }
          }}
          disabled={currentCategoryIndex === 0}
          className="text-xs sm:text-sm md:text-base"
        >
          Previous
        </Button>
        
        {currentCategoryIndex < categories.length - 1 ? (
          <Button 
            onClick={() => {
              // Only allow moving to next category if all questions in current category are answered
              const currentCategory = categories[currentCategoryIndex];
              const allAnswered = currentCategory.questions.every(
                (q: Question) => responses[q.id] !== undefined
              );
              
              if (allAnswered) {
                setCurrentCategoryIndex(currentCategoryIndex + 1);
                window.scrollTo(0, 0);
              } else {
                toast.warning('Please answer all questions in this category first');
              }
            }}
            className={`bg-gradient-to-r ${CATEGORIES[currentQuestion?.category]?.gradient || ''} text-white text-xs sm:text-sm md:text-base`}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered || submitting}
            className={`bg-gradient-to-r ${CATEGORIES[currentQuestion?.category]?.gradient || ''} text-white text-xs sm:text-sm md:text-base`}
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
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