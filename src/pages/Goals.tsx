import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Target, TrendingUp, BookOpen, AlertCircle, Star, Info, ArrowRight, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getAssessmentHistory } from '@/lib/supabase';
import { getAssessmentType } from '@/lib/assessmentType';
import { CATEGORIES } from '@/lib/questions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  timeline: string;
  actionType: string;
  progress: number;
  createdAt: string;
  dueDate: string;
}

export default function Goals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [profile, setProfile] = useState<any>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);

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

        // Generate AI goals based on assessment
        generateGoals(latestAssessment, profileData?.gender);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
    
    // Add effect to refresh data when assessment is updated
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
            // Refresh the assessment data and goals
            fetchLatestAssessment(user.id);
            toast.info('Your goals have been updated based on new assessment data');
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);
  
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
      
      // Regenerate goals based on latest assessment
      generateGoals(latestAssessment, profileData?.gender);
    } catch (error) {
      console.error('Error fetching latest assessment:', error);
    }
  };

  const generateGoals = (assessmentData: any, gender: string | undefined) => {
    if (!assessmentData) {
      // Use mock data if no assessment is available
      const mockGoals = getMockGoals();
      setGoals(mockGoals);
      return;
    }
    
    const newGoals: Goal[] = [];
    
    // Get the lowest scoring categories
    const weakCategories = [...assessmentData.category_scores]
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5);
    
    // Generate goals based on weak categories
    weakCategories.forEach(category => {
      const goalData = getGoalsForCategory(category.category, gender || 'male', category.percentage);
      if (goalData && goalData.length > 0) {
        goalData.forEach(goal => {
          newGoals.push({
            id: Math.random().toString(36).substring(2, 11),
            ...goal,
            category: category.category,
            progress: Math.floor(Math.random() * 70), // Random progress between 0-70%
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + (parseInt(goal.timeline) * 24 * 60 * 60 * 1000)).toISOString(),
          });
        });
      }
    });
    
    setGoals(newGoals);
  };

  const getMockGoals = (): Goal[] => {
    return [
      {
        id: '1',
        title: 'Improve Conflict Recovery',
        description: 'Practice reflective listening in next 3 disagreements',
        category: 'Conflict Resolution Style',
        timeline: '30 Days',
        actionType: 'Behavioral',
        progress: 33,
        createdAt: '2025-05-01T00:00:00.000Z',
        dueDate: '2025-05-31T00:00:00.000Z'
      },
      {
        id: '2',
        title: 'Financial Awareness',
        description: 'Track spending manually for 2 weeks',
        category: 'Financial Traits',
        timeline: '14 Days',
        actionType: 'Habit',
        progress: 50,
        createdAt: '2025-05-05T00:00:00.000Z',
        dueDate: '2025-05-19T00:00:00.000Z'
      },
      {
        id: '3',
        title: 'Physical Consistency',
        description: 'Exercise 3x/week to improve self-discipline & confidence',
        category: 'Physical Traits',
        timeline: '21 Days',
        actionType: 'Routine',
        progress: 14,
        createdAt: '2025-05-10T00:00:00.000Z',
        dueDate: '2025-05-31T00:00:00.000Z'
      },
      {
        id: '4',
        title: 'Emotional Intelligence',
        description: 'Practice identifying emotions before reacting in conversations',
        category: 'Emotional Traits',
        timeline: '30 Days',
        actionType: 'Habit',
        progress: 80,
        createdAt: '2025-04-15T00:00:00.000Z',
        dueDate: '2025-05-15T00:00:00.000Z'
      },
      {
        id: '5',
        title: 'Active Listening',
        description: 'Read book on communication and practice with partner',
        category: 'Mental Traits',
        timeline: '14 Days',
        actionType: 'Project',
        progress: 100,
        createdAt: '2025-04-01T00:00:00.000Z',
        dueDate: '2025-04-15T00:00:00.000Z'
      }
    ];
  };

  const getGoalsForCategory = (
    category: string, 
    gender: string, 
    score: number
  ): Array<{
    title: string;
    description: string;
    timeline: string;
    actionType: string;
  }> => {
    // Goals database with category-specific goals
    const goalsByCategory = {
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
        },
        {
          title: 'Develop Growth Mindset',
          description: 'Identify 3 fixed mindsets you have and challenge them weekly',
          timeline: '21 Days',
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
        },
        {
          title: 'Emotional Regulation',
          description: 'Implement a 2-minute calm-down technique when emotionally triggered',
          timeline: '30 Days',
          actionType: 'Technique'
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
        },
        {
          title: 'Physical Affection',
          description: 'Initiate non-sexual physical touch daily with your partner',
          timeline: '14 Days',
          actionType: 'Habit'
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
        },
        {
          title: 'Financial Transparency',
          description: 'Have an honest discussion about finances with your partner',
          timeline: '14 Days',
          actionType: 'Conversation'
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
        },
        {
          title: 'Cultural Appreciation',
          description: 'Learn about and appreciate an aspect of your partner\'s culture',
          timeline: '21 Days',
          actionType: 'Project'
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
        },
        {
          title: 'Conflict Resolution Study',
          description: 'Read a book on healthy conflict resolution techniques',
          timeline: '30 Days',
          actionType: 'Project'
        }
      ]
    };

    // Get goals for the category
    const categoryGoals = goalsByCategory[category as keyof typeof goalsByCategory];
    if (!categoryGoals) return [];

    // Select goals based on score (lower scores get more goals)
    if (score < 50) {
      return categoryGoals; // All goals for very low scores
    } else if (score < 65) {
      return categoryGoals.slice(0, 2); // First two goals for low-medium scores
    } else {
      return [categoryGoals[0]]; // Just one goal for higher scores
    }
  };

  const handleUpdateProgress = (id: string, newProgress: number) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, progress: newProgress } : goal
    ));
    toast.success('Progress updated');
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
          <p>Loading your AI-recommended goals...</p>
        </div>
      </div>
    );
  }

  const activeGoals = goals.filter(goal => goal.progress < 100);
  const completedGoals = goals.filter(goal => goal.progress === 100);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8" style={{ 
        background: 'linear-gradient(90deg, #ff0099, #9900ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        AI-Recommended Growth Plan
      </h1>

      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Goals Available</h2>
            <p className="text-muted-foreground mb-6">
              Your personalized goals will appear here after you complete your self-assessment.
            </p>
            <Button
              onClick={() => navigate('/assessment')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              Take Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Section */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">AI-Generated Growth Plan</h2>
                  <p className="text-muted-foreground mt-1">
                    Based on your assessment results and areas for improvement
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/self-improvement')} 
                  variant="outline"
                  className="mt-4 md:mt-0"
                >
                  View Full Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Goal Suggestions Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5 text-pink-500" />
                Recommended Growth Goals
              </CardTitle>
              <CardDescription>
                Goals automatically generated based on your assessment results
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
                    {goals.map((goal) => (
                      <TableRow key={goal.id}>
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
            </CardContent>
          </Card>
        
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex w-full rounded-lg overflow-hidden mb-6">
              {['Active Goals', 'Completed'].map(tab => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase()}
                  className={`flex-1 px-4 py-2 font-medium transition-all
                    bg-white text-gray-900 border border-gray-200
                    data-[state=active]:border-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-700
                    hover:text-purple-600 hover:border-pink-300
                  `}
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="active">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {activeGoals.map(goal => {
                  const categoryInfo = CATEGORIES[goal.category] || {
                    color: 'bg-gray-500',
                    gradient: 'from-gray-500 to-gray-600'
                  };
                  
                  // Calculate days remaining
                  const dueDate = new Date(goal.dueDate);
                  const today = new Date();
                  const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <Card key={goal.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center text-lg">
                              <span className={`w-3 h-3 rounded-full mr-2 ${categoryInfo.color}`} />
                              {goal.title}
                            </CardTitle>
                            <CardDescription>{goal.category}</CardDescription>
                          </div>
                          <Badge variant="outline" className="flex items-center h-6 whitespace-nowrap">
                            {getActionIcon(goal.actionType)}
                            <span className="ml-1 text-xs">{goal.actionType}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <p className="text-sm mb-4">{goal.description}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className={`h-2 ${categoryInfo.gradient ? `bg-gradient-to-r ${categoryInfo.gradient}` : ''}`} />
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Timeline: {goal.timeline}</span>
                          <span className={daysRemaining < 3 ? "text-red-500 font-medium" : ""}>
                            {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Due today"}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateProgress(goal.id, Math.min(100, goal.progress + 25))}
                          className="w-full"
                        >
                          Update Progress
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {completedGoals.map(goal => {
                  const categoryInfo = CATEGORIES[goal.category] || {
                    color: 'bg-gray-500',
                    gradient: 'from-gray-500 to-gray-600'
                  };
                  
                  // Calculate completion date from the createdAt and timeline
                  const completedDate = new Date(goal.dueDate);
                  const completedDateStr = completedDate.toLocaleDateString();
                  
                  return (
                    <Card key={goal.id} className="bg-gray-50/50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center text-lg">
                              <span className={`w-3 h-3 rounded-full mr-2 ${categoryInfo.color}`} />
                              {goal.title}
                            </CardTitle>
                            <CardDescription>{goal.category}</CardDescription>
                          </div>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                            Completed
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-4">{goal.description}</p>
                        <Progress value={100} className="h-2 bg-green-500" />
                        <div className="mt-4 text-xs text-muted-foreground">
                          Completed on {completedDateStr}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      <div className="flex justify-center mt-8">
        <Button 
          onClick={() => navigate('/self-improvement')} 
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
        >
          Back to Improvement Plan
        </Button>
      </div>
    </div>
  );
}