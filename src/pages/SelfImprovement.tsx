import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Info, TrendingUp, Check, AlertTriangle, AlertCircle, BookOpen, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getAssessmentHistory } from '@/lib/supabase';
import { getAssessmentType } from '@/lib/assessmentType';
import { calculateDelusionalScore, type CategoryGap } from '@/lib/delusionalScore';
import { getBadgeForScore } from '@/lib/scores';
import { CATEGORIES } from '@/lib/questions';

interface Profile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  dob: string;
  region: string;
  cultural_context: string;
}

interface Goal {
  title: string;
  description: string;
  timeline: string;
  actionType: string;
  category: string;
  progress: number;
}

interface GrowthArea {
  category: string;
  score: number;
  severity: 'critical' | 'moderate' | 'minor';
  description: string;
}

export default function SelfImprovement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [delusionalScore, setDelusionalScore] = useState<any>(null);
  const [growthAreas, setGrowthAreas] = useState<GrowthArea[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState('plan');

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(profileData);

        // Get assessment data
        const { data: assessments } = await getAssessmentHistory(user.id);
        
        if (!assessments || assessments.length === 0) {
          setLoading(false);
          return;
        }

        // Get the latest assessment
        const assessmentType = getAssessmentType(profileData);
        const latestAssessment = assessments
          .filter(a => a.assessment_type === assessmentType)
          .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];

        setAssessmentData(latestAssessment);

        // Get delusional score
        if (assessmentType) {
          const delusionalData = await calculateDelusionalScore(user.id, assessmentType);
          setDelusionalScore(delusionalData);
          
          // Generate growth areas from assessment and delusional data
          generateGrowthAreas(latestAssessment, delusionalData);
        }

        // Generate goals
        generateGoals(latestAssessment, profileData?.gender);

      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
    
    // Listen for delusional score updates
    const handleDelusionalScoreUpdate = (event: CustomEvent) => {
      const { userId, assessmentType, delusionalResult } = event.detail;
      
      // Check if this update is for the current user
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && user.id === userId) {
          setDelusionalScore(delusionalResult);
          if (assessmentData) {
            generateGrowthAreas(assessmentData, delusionalResult);
          }
          toast.success('Self-awareness score has been updated');
        }
      });
    };

    // Add event listener for delusional score updates
    window.addEventListener('delusional-score-updated', handleDelusionalScoreUpdate as EventListener);

    // Clean up the event listener
    return () => {
      window.removeEventListener('delusional-score-updated', handleDelusionalScoreUpdate as EventListener);
    };
  }, [navigate]);
  
  // Add effect to refresh data when assessment is updated
  useEffect(() => {
    const channel = supabase
      .channel('assessment_updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'assessment_history'
      }, payload => {
        // Check if this update is for the current user
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user && user.id === payload.new.user_id) {
            // Refresh the assessment data
            fetchLatestAssessment(user.id);
            toast.info('Your assessment data has been updated');
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLatestAssessment = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data: assessments } = await getAssessmentHistory(userId);
      
      if (!assessments || assessments.length === 0) return;

      // Get the latest assessment
      const assessmentType = getAssessmentType(profileData);
      const latestAssessment = assessments
        .filter(a => a.assessment_type === assessmentType)
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];

      setAssessmentData(latestAssessment);
      
      // Recalculate delusional score with the latest data
      if (assessmentType) {
        const delusionalData = await calculateDelusionalScore(userId, assessmentType);
        setDelusionalScore(delusionalData);
        
        // Generate growth areas from assessment and delusional data
        generateGrowthAreas(latestAssessment, delusionalData);
      }

      // Regenerate goals based on latest assessment
      generateGoals(latestAssessment, profileData?.gender);
    } catch (error) {
      console.error('Error fetching latest assessment:', error);
    }
  };

  const generateGrowthAreas = (assessmentData: any, delusionalData: any) => {
    if (!assessmentData) return;

    const areas: GrowthArea[] = [];

    // Sort categories by score (ascending)
    const sortedCategories = [...assessmentData.category_scores]
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3); // Get the three lowest scoring categories

    // Add lowest scoring categories
    sortedCategories.forEach(category => {
      areas.push({
        category: category.category,
        score: category.percentage,
        severity: category.percentage < 50 ? 'critical' : category.percentage < 65 ? 'moderate' : 'minor',
        description: getGrowthAreaDescription(category.category, category.percentage)
      });
    });

    // Add delusional gaps if available
    if (delusionalData && delusionalData.category_gaps) {
      delusionalData.category_gaps
        .filter((gap: CategoryGap) => gap.gap > 15) // Only significant gaps
        .sort((a: CategoryGap, b: CategoryGap) => b.gap - a.gap) // Sort by gap size
        .slice(0, 2) // Get top 2
        .forEach((gap: CategoryGap) => {
          // Check if this category is already in growth areas
          const existingIndex = areas.findIndex(area => area.category === gap.category);
          
          if (existingIndex >= 0) {
            // Update existing area to mention the perception gap
            areas[existingIndex].description += ` There's also a ${gap.gap.toFixed(0)}% gap between how you see yourself and how others perceive you in this area.`;
            // Increase severity if it's a big gap
            if (gap.gap > 25 && areas[existingIndex].severity !== 'critical') {
              areas[existingIndex].severity = 'moderate';
            }
          } else if (areas.length < 3) { // Limit to 3 total areas
            areas.push({
              category: gap.category,
              score: gap.self_score, // Use self score
              severity: gap.gap > 25 ? 'critical' : 'moderate',
              description: `There's a significant perception gap of ${gap.gap.toFixed(0)}% between how you rate yourself (${gap.self_score.toFixed(0)}%) and how others see you (${gap.external_score.toFixed(0)}%) in this area.`
            });
          }
        });
    }

    // Limit to 3 areas, prioritizing critical ones
    areas.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return a.score - b.score;
    });

    setGrowthAreas(areas.slice(0, 3));
  };

  const generateGoals = (assessmentData: any, gender: string | undefined) => {
    if (!assessmentData) return;
    
    const newGoals: Goal[] = [];
    
    // Get the three lowest scoring categories
    const weakCategories = [...assessmentData.category_scores]
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3);
    
    // Generate goals based on weak categories
    weakCategories.forEach(category => {
      const goalData = getGoalForCategory(category.category, gender || 'male');
      if (goalData) {
        newGoals.push({
          ...goalData,
          category: category.category,
          progress: Math.random() * 30 // Mock progress (0-30%)
        });
      }
    });
    
    setGoals(newGoals);
  };

  const getGrowthAreaDescription = (category: string, score: number): string => {
    // Descriptions based on category and score
    const descriptions: Record<string, { low: string, medium: string, high: string }> = {
      'Mental Traits': {
        low: "You struggle with accountability and responding calmly to challenges.",
        medium: "You sometimes have difficulty accepting feedback or managing your reactions.",
        high: "You generally demonstrate good mental flexibility but have room to improve."
      },
      'Emotional Traits': {
        low: "You have difficulty expressing emotions appropriately and providing emotional safety.",
        medium: "You sometimes struggle with emotional consistency or validating others' feelings.",
        high: "Your emotional awareness is good but could be more consistent."
      },
      'Physical Traits': {
        low: "You're inconsistent with physical self-care and presentation.",
        medium: "You maintain basic physical care but could be more attentive to details.",
        high: "You generally maintain good physical habits but have specific areas to improve."
      },
      'Financial Traits': {
        low: "Your financial habits show significant room for improvement in planning and discipline.",
        medium: "You handle basic finances but lack long-term planning or transparency.",
        high: "Your financial approach is generally sound but has specific weak points."
      },
      'Family & Cultural Compatibility': {
        low: "You struggle with respecting cultural differences and managing family boundaries.",
        medium: "You navigate family dynamics moderately well but sometimes impose your views.",
        high: "You're generally culturally respectful but have specific areas to develop."
      },
      'Conflict Resolution Style': {
        low: "You have significant difficulty managing conflicts constructively.",
        medium: "You handle some conflicts well but often escalate or withdraw inappropriately.",
        high: "Your conflict resolution is generally effective but has specific points to refine."
      }
    };

    const categoryDescriptions = descriptions[category] || {
      low: "This area needs significant improvement.",
      medium: "You show moderate competence in this area.",
      high: "You're doing well in this area but have specific points to improve."
    };

    if (score < 50) return categoryDescriptions.low;
    if (score < 75) return categoryDescriptions.medium;
    return categoryDescriptions.high;
  };

  const getGoalForCategory = (category: string, gender: string): Omit<Goal, 'category' | 'progress'> | null => {
    const goals = {
      'Mental Traits': [
        {
          title: 'Improve Self-Reflection',
          description: 'Journal for 10 minutes daily about your thoughts and reactions',
          timeline: '30 Days',
          actionType: 'Habit'
        },
        {
          title: 'Enhance Active Listening',
          description: 'Practice reflective listening in your next 3 disagreements',
          timeline: '14 Days',
          actionType: 'Behavioral'
        }
      ],
      'Emotional Traits': [
        {
          title: 'Build Emotional Awareness',
          description: 'Identify and name your emotions when they arise (3x daily)',
          timeline: '21 Days',
          actionType: 'Habit'
        },
        {
          title: 'Practice Daily Appreciation',
          description: 'Express one specific appreciation to your partner daily',
          timeline: '14 Days',
          actionType: 'Behavioral'
        }
      ],
      'Physical Traits': [
        {
          title: 'Physical Consistency',
          description: 'Exercise 3x/week to improve self-discipline & confidence',
          timeline: '21 Days',
          actionType: 'Routine'
        },
        {
          title: 'Appearance Upgrade',
          description: 'Update your grooming routine and wardrobe basics',
          timeline: '30 Days',
          actionType: 'Project'
        }
      ],
      'Financial Traits': [
        {
          title: 'Financial Awareness',
          description: 'Track spending manually for 2 weeks',
          timeline: '14 Days',
          actionType: 'Habit'
        },
        {
          title: 'Financial Planning Session',
          description: 'Create a basic budget with 3-month goals',
          timeline: '7 Days',
          actionType: 'Project'
        }
      ],
      'Family & Cultural Compatibility': [
        {
          title: 'Cultural Understanding',
          description: 'Have a discussion about family traditions and values',
          timeline: '21 Days',
          actionType: 'Conversation'
        },
        {
          title: 'Family Boundaries',
          description: 'Establish clear boundaries for family involvement',
          timeline: '30 Days',
          actionType: 'Behavioral'
        }
      ],
      'Conflict Resolution Style': [
        {
          title: 'Improve Conflict Recovery',
          description: 'Practice reflective listening in next 3 disagreements',
          timeline: '30 Days',
          actionType: 'Behavioral'
        },
        {
          title: 'De-escalation Practice',
          description: 'Use "I" statements and time-outs in heated moments',
          timeline: '21 Days',
          actionType: 'Technique'
        }
      ]
    };

    // Get goals for the category
    const categoryGoals = goals[category as keyof typeof goals];
    if (!categoryGoals) return null;

    // Return a goal based on gender (just to add some variety)
    return gender === 'male' ? categoryGoals[0] : categoryGoals[1];
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'moderate':
        return 'text-amber-600 bg-amber-100 border-amber-200';
      case 'minor':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'moderate':
        return <AlertTriangle className="h-4 w-4" />;
      case 'minor':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'Habit':
        return <Check className="h-4 w-4" />;
      case 'Behavioral':
        return <TrendingUp className="h-4 w-4" />;
      case 'Routine':
        return <Target className="h-4 w-4" />;
      case 'Project':
        return <BookOpen className="h-4 w-4" />;
      case 'Conversation':
        return <Info className="h-4 w-4" />;
      case 'Technique':
        return <Star className="h-4 w-4" />;
      default:
        return <Check className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p>Loading your personalized improvement plan...</p>
        </div>
      </div>
    );
  }

  if (!assessmentData) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8" style={{ 
          background: 'linear-gradient(90deg, #ff0099, #9900ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Self-Improvement Plan
        </h1>
        
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6 text-center">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">No Assessment Data Found</h2>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              To generate your personalized improvement plan, please complete at least one assessment.
            </p>
            <Button
              onClick={() => navigate('/assessment')}
              className="bg-white text-gray-900 border border-gray-200 hover:text-purple-600 hover:border-pink-300 focus:border-2 focus:border-pink-500 focus:text-pink-700 transition-all"
            >
              Take Assessment
            </Button>
          </CardContent>
        </Card>
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
        Personal Development Plan
      </h1>

      {/* A. Overview Header */}
      <Card className="mb-8">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
            <div className="w-full md:w-auto">
              <h2 className="text-lg sm:text-2xl font-semibold">{profile?.name || 'User'}'s Growth Plan</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                {getBadgeForScore(assessmentData.overall_percentage, assessmentData.assessment_type)} • {assessmentData.overall_percentage.toFixed(0)}% Score
              </p>
              <p className="mt-2 max-w-md text-sm sm:text-base">
                {growthAreas.length > 0 ? 
                  `You're strong in ${
                    assessmentData.category_scores.sort((a: any, b: any) => b.percentage - a.percentage)[0].category
                  } but need to work on ${
                    growthAreas.map(area => area.category).join(' and ')
                  }.` :
                  "Complete your self-assessment to see your strengths and improvement areas."}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex justify-center w-full md:w-auto">
              <div className="inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border-8 border-gray-50 bg-white">
                <div className="text-center">
                  <span className="text-xl sm:text-2xl font-bold">{assessmentData.overall_percentage.toFixed(0)}%</span>
                  <p className="text-xs text-muted-foreground">Overall</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="plan">Development Plan</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="plan">
          {/* B. Breakdown of Key Growth Areas */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {growthAreas.map((area, index) => {
              const categoryInfo = CATEGORIES[area.category] || {
                color: 'bg-gray-500',
                description: 'How you perform in this area',
                gradient: 'from-gray-500 to-gray-600'
              };
              
              return (
                <Card key={index}>
                  <CardHeader className={`pb-2`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          <span className={`w-3 h-3 rounded-full mr-2 ${categoryInfo.color}`} />
                          {area.category}
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`mt-2 ${getSeverityColor(area.severity)}`}
                        >
                          <span className="flex items-center">
                            {getSeverityIcon(area.severity)}
                            <span className="ml-1 capitalize">{area.severity}</span>
                          </span>
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">{area.score.toFixed(0)}%</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{area.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* C. AI Goal Suggestions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5 text-pink-500" />
                AI Goal Suggestions
              </CardTitle>
              <CardDescription>
                Recommended goals based on your assessment results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goal Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Action Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goals.map((goal, index) => (
                      <TableRow key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate('/goals')}>
                        <TableCell className="font-medium">{goal.title}</TableCell>
                        <TableCell>{goal.description}</TableCell>
                        <TableCell>{goal.timeline}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center w-fit">
                            {getActionIcon(goal.actionType)}
                            <span className="ml-1">{goal.actionType}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Each goal links directly to the Goals Page
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => navigate('/goals')} 
                className="w-full bg-white text-gray-900 border border-gray-200 hover:text-purple-600 hover:border-pink-300 focus:border-2 focus:border-pink-500 focus:text-pink-700 transition-all"
              >
                View Complete Goal Plan
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          {/* D. AI Feedback Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI Insights & Analysis</CardTitle>
              <CardDescription>
                Deeper understanding of your assessment results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pattern Insights */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-semibold flex items-center mb-2">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                  Patterns Detected
                </h3>
                <p className="text-sm">
                  {delusionalScore ? 
                    `There's a consistent ${delusionalScore.overall_score > 20 ? 'gap' : 'alignment'} between how you see yourself and how others perceive you. ${
                      delusionalScore.overall_score > 20 
                        ? 'This suggests you may have blind spots in your self-awareness that are worth exploring.'
                        : 'This indicates strong self-awareness, which is a powerful foundation for growth.'
                    }`
                    :
                    `Your assessment results show a pattern of ${
                      growthAreas.length > 0 
                        ? `strength in ${
                            assessmentData.category_scores.sort((a: any, b: any) => b.percentage - a.percentage)[0].category
                          } contrasted with challenges in ${
                            growthAreas.map(area => area.category).join(' and ')
                          }.`
                        : 'varied performance across different categories.'
                    }`
                  }
                </p>
              </div>

              {/* Root Cause Analysis */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h3 className="font-semibold flex items-center mb-2">
                  <Target className="h-4 w-4 mr-2 text-purple-500" />
                  Potential Root Causes
                </h3>
                <p className="text-sm">
                  {growthAreas.length > 0 ?
                    `Your challenges in ${growthAreas[0].category} may stem from ${
                      growthAreas[0].category === 'Mental Traits' ? 'habitual thought patterns formed early in life'
                      : growthAreas[0].category === 'Emotional Traits' ? 'emotional regulation patterns learned in childhood'
                      : growthAreas[0].category === 'Physical Traits' ? 'inconsistent habits and routines'
                      : growthAreas[0].category === 'Financial Traits' ? 'underlying beliefs about money and security'
                      : growthAreas[0].category === 'Family & Cultural Compatibility' ? 'deeply ingrained family dynamics'
                      : 'communication patterns that escalate rather than resolve tension'
                    }. Addressing these root causes will lead to more sustainable change.`
                    :
                    "Complete more assessments to receive personalized root cause analysis."
                  }
                </p>
              </div>

              {/* Growth Roadmap */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h3 className="font-semibold flex items-center mb-2">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                  Your Growth Roadmap
                </h3>
                <p className="text-sm mb-3">
                  Based on your current results, your personalized development path:
                </p>
                <ol className="space-y-2 text-sm pl-5 list-decimal">
                  <li>
                    <span className="font-medium">First 30 days:</span> Focus on building awareness and small habit changes
                  </li>
                  <li>
                    <span className="font-medium">30-90 days:</span> Implement structured practice in your weak areas
                  </li>
                  <li>
                    <span className="font-medium">Beyond 90 days:</span> Integrate new behaviors and reassess progress
                  </li>
                </ol>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Recommended Resources</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {growthAreas.slice(0, 2).map((area, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <h4 className="font-medium mb-1 flex items-center">
                        <BookOpen className="h-3.5 w-3.5 mr-1 text-purple-500" />
                        For {area.category}:
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {area.category === 'Mental Traits' ? '"Mindset" by Carol Dweck'
                        : area.category === 'Emotional Traits' ? '"Permission to Feel" by Marc Brackett'
                        : area.category === 'Physical Traits' ? '"Atomic Habits" by James Clear'
                        : area.category === 'Financial Traits' ? '"The Psychology of Money" by Morgan Housel'
                        : area.category === 'Family & Cultural Compatibility' ? '"The 5 Love Languages" by Gary Chapman'
                        : '"Difficult Conversations" by Douglas Stone'
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center">
        <Button 
          onClick={() => navigate('/goals')} 
          className="w-full bg-white text-gray-900 border border-gray-200 hover:text-purple-600 hover:border-pink-300 focus:border-2 focus:border-pink-500 focus:text-pink-700 transition-all"
        >
          View All Goals
        </Button>
        <Button 
          onClick={() => navigate('/assessment')} 
          className="bg-white text-gray-900 border border-gray-200 hover:text-purple-600 hover:border-pink-300 focus:border-2 focus:border-pink-500 focus:text-pink-700 transition-all"
        >
          Retake Assessment
        </Button>
      </div>
    </div>
  );
}