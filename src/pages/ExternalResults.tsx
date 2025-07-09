import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getExternalAssessmentResults, 
  calculateExternalAssessmentSummary, 
  getExternalAssessmentById,
  type ExternalAssessmentSummary,
  type ExternalAssessmentResult
} from '@/lib/externalAssessments';
import { getAssessmentTypeName } from '@/lib/assessors';
import { getBadgeForScore } from '@/lib/scores';
import { CATEGORIES } from '@/lib/questions';
import { calculateDelusionalScore, type DelusionalScoreResult } from '@/lib/delusionalScore';
import { CategoryComparisonChart } from '@/components/CategoryComparisonChart';
import { DelusionalScoreHeader } from '@/components/DelusionalScoreHeader';
import { AIFeedbackSummary } from '@/components/AIFeedbackSummary';
import { RaterBreakdown } from '@/components/RaterBreakdown';
import { ExternalAssessmentDetails } from '@/components/ExternalAssessmentDetails';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Users, Calendar, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getAssessmentType } from '@/lib/assessmentType';
import { toast } from 'sonner';

export default function ExternalResults() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ExternalAssessmentSummary | null>(null);
  const [assessments, setAssessments] = useState<ExternalAssessmentResult[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<ExternalAssessmentResult | null>(null);
  const [activeTab, setActiveTab] = useState('delusional');
  const [profile, setProfile] = useState<any>(null);
  const [delusionalScore, setDelusionalScore] = useState<DelusionalScoreResult | null>(null);
  
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        setProfile(profileData);
        
        return profileData;
      } catch (err) {
        console.error('Error fetching user profile:', err);
        return null;
      }
    }
    
    async function fetchResults(userProfile: any) {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        
        // Determine assessment type
        let assessmentType = type as any;
        
        if (!assessmentType && userProfile) {
          assessmentType = getAssessmentType(userProfile);
        }
        
        // Get external assessment results
        const { data, error } = await getExternalAssessmentResults(
          user.id, 
          assessmentType || undefined
        );
        
        if (error) throw error;
        
        if (data.length === 0) {
          setError('No external assessment results found');
          setLoading(false);
          return;
        }
        
        // Store all assessments
        setAssessments(data);
        
        // Calculate summary
        const calculatedSummary = calculateExternalAssessmentSummary(data);
        setSummary(calculatedSummary);
        
        // Calculate delusional score
        if (assessmentType) {
          await calculateAndSetDelusionalScore(user.id, assessmentType);
        }
        
      } catch (err) {
        console.error('Error fetching external results:', err);
        setError('Failed to load external assessment results');
      } finally {
        setLoading(false);
      }
    }
    
    // Chain the operations
    fetchUserProfile().then(profile => {
      fetchResults(profile);
    });
  }, [navigate, type]);

  // Function to calculate delusional score
  const calculateAndSetDelusionalScore = async (userId: string, assessmentType: any) => {
    try {
      setCalculating(true);
      console.log('[DelusionalScore] Calculating for user:', userId, 'type:', assessmentType);
      const result = await calculateDelusionalScore(userId, assessmentType);
      if (result) {
        setDelusionalScore(result);
      } else {
        if (delusionalScore !== null) {
          toast.error('Failed to calculate self-awareness score');
        }
        console.error('[DelusionalScore] Calculation returned null for user:', userId, 'type:', assessmentType);
      }
    } catch (err) {
      console.error('[DelusionalScore] Error calculating delusional score:', err, 'user:', userId, 'type:', assessmentType);
      toast.error('Error calculating delusional score');
    } finally {
      setCalculating(false);
    }
  };

  const handleRecalculateScore = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const assessmentType = summary?.assessment_type || getAssessmentType(profile);
    
    if (assessmentType) {
      await calculateAndSetDelusionalScore(user.id, assessmentType);
      toast.success('Self-awareness score recalculated');
    }
  };

  const handleSelectAssessment = (assessment: ExternalAssessmentResult) => {
    setSelectedAssessment(assessment);
    setActiveTab('details');
  };

  const handleBackToList = () => {
    setSelectedAssessment(null);
    setActiveTab(delusionalScore ? 'delusional' : 'summary');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || (!summary && !assessments.length)) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'No external assessment results available'}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => navigate('/assessors')}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
        >
          Invite External Assessors
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8" style={{ 
        background: 'linear-gradient(90deg, #ff0099, #9900ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Delusional Assessment Results
      </h1>

      {!selectedAssessment ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="delusional" className="text-sm sm:text-base">Delusional Score</TabsTrigger>
            <TabsTrigger value="summary" className="text-sm sm:text-base">Delusional Summary</TabsTrigger>
            <TabsTrigger value="list" className="text-sm sm:text-base">Individual Results</TabsTrigger>
          </TabsList>

          <TabsContent value="delusional">
            {delusionalScore ? (
              <div className="space-y-6">
                <DelusionalScoreHeader 
                  score={delusionalScore.overall_score} 
                  status={delusionalScore.status}
                  assessmentCount={delusionalScore.external_assessment_count}
                />
                
                <CategoryComparisonChart categories={delusionalScore.category_gaps} />
                
                <AIFeedbackSummary 
                  categoryGaps={delusionalScore.category_gaps}
                  overallScore={delusionalScore.overall_score}
                />
                
                <RaterBreakdown 
                  assessments={assessments}
                  onSelectAssessment={handleSelectAssessment}
                />
                
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={handleRecalculateScore}
                    disabled={calculating}
                  >
                    {calculating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recalculating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Recalculate Delusional Score
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                {calculating ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Calculating self-awareness score...</p>
                  </>
                ) : (
                  <>
                    <Alert className="max-w-xl mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Delusional Score Unavailable</AlertTitle>
                      <AlertDescription>
                        To calculate your Delusional Score, you need both a self-assessment and at least one delusional (external) assessment.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-4">
                      <Button
                        onClick={() => navigate('/assessment')}
                        variant="outline"
                      >
                        Take Self-Assessment
                      </Button>
                      <Button
                        onClick={() => navigate('/assessors')}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                      >
                        Invite Assessors
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary">
            {summary && (
              <>
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      How Delusional Are You?
                    </CardTitle>
                    <CardDescription>
                      Combined results from {summary.count} delusional {summary.count === 1 ? 'assessment' : 'assessments'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="text-5xl font-bold mb-2">
                        {Math.round(summary.average_percentage)}%
                      </div>
                      <div className="text-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                        {getBadgeForScore(summary.average_percentage, summary.assessment_type)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {getAssessmentTypeName(summary.assessment_type)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2 mb-8">
                  {Array.isArray(summary.category_averages) && summary.category_averages.map((category) => {
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
                          <CardDescription>
                            {categoryInfo.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Progress 
                              value={category.average_percentage} 
                              className={`h-2 ${categoryInfo?.gradient ? `bg-gradient-to-r ${categoryInfo.gradient}` : ''}`}
                            />
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Delusional Score: {category.average_percentage.toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-sm mt-2">
                              {getCategoryFeedback(category.category, category.average_percentage)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => setActiveTab('delusional')}
                      variant="outline"
                    >
                    View Delusional Score
                    </Button>
                  <Button
                    onClick={() => setActiveTab('list')}
                    variant="outline"
                  >
                    View Individual Results
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Individual Assessment Results</CardTitle>
                <CardDescription>
                  View individual feedback from each external assessor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead className="hidden md:table-cell">Assessment Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(assessments) && assessments.map((assessment) => (
                        <TableRow key={assessment.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                              {format(new Date(assessment.completed_at), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {/* We'll fetch this from assessor_id in the component */}
                            Loading...
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{Math.round(assessment.overall_percentage)}%</span>
                              <Badge variant="outline">
                                {getBadgeForScore(assessment.overall_percentage, assessment.assessment_type)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {getAssessmentTypeName(assessment.assessment_type)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectAssessment(assessment)}
                              className="hover:bg-gray-100"
                            >
                              View Details
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                  onClick={() => setActiveTab('delusional')}
                    variant="outline"
                  >
                  View Delusional Score
                  </Button>
                  <Button
                  onClick={() => setActiveTab('summary')}
                    variant="outline"
                  >
                    View Summary
                  </Button>
                <Button
                  onClick={() => navigate('/assessors')}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white w-full sm:w-auto"
                >
                  Invite More Assessors
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <ExternalAssessmentDetails 
          assessment={selectedAssessment} 
          onBack={handleBackToList} 
        />
      )}
    </div>
  );
}

function getCategoryFeedback(category: string, score: number): string {
  const feedbackMap: Record<string, { high: string, medium: string, low: string }> = {
    'Mental Traits': {
      high: 'Others see you as mentally sharp, accountable, and open to growth.',
      medium: 'Others see you as having average mental flexibility and openness to feedback.',
      low: 'Others may see you as resistant to feedback or having fixed mindsets.'
    },
    'Emotional Traits': {
      high: 'Others perceive you as emotionally intelligent, supportive, and empathetic.',
      medium: 'Others see you as having moderate emotional awareness and consistency.',
      low: 'Others may see you as emotionally unavailable or inconsistent.'
    },
    'Physical Traits': {
      high: 'Others see you as well-groomed, physically present, and attentive.',
      medium: 'Others perceive you as having average physical presentation and attention.',
      low: 'Others may see you as neglecting physical appearance or presence.'
    },
    'Financial Traits': {
      high: 'Others view you as financially responsible, transparent, and future-oriented.',
      medium: 'Others see you as having moderate financial discipline and planning.',
      low: 'Others may see you as financially impulsive or lacking planning.'
    },
    'Family & Cultural Compatibility': {
      high: 'Others see you as respectful of cultural differences and family dynamics.',
      medium: 'Others perceive you as having moderate cultural adaptability.',
      low: 'Others may see you as rigid in cultural expectations or values.'
    },
    'Conflict Resolution Style': {
      high: 'Others view you as excellent at de-escalating and resolving conflicts peacefully.',
      medium: 'Others see you as having moderate conflict resolution skills.',
      low: 'Others may see you as confrontational or avoidant during conflicts.'
    }
  };

  const categoryFeedback = feedbackMap[category] || {
    high: 'Others rate you highly in this area.',
    medium: 'Others see you as average in this area.',
    low: 'Others identify this as an area for improvement.'
  };

  if (score >= 75) return categoryFeedback.high;
  if (score >= 50) return categoryFeedback.medium;
  return categoryFeedback.low;
}