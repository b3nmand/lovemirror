import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Target, Calendar, Award, Activity, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AssessmentHistory {
  id: string;
  assessment_type: string;
  category_scores: Array<{
    category: string;
    score: number;
    percentage: number;
    weight: number;
  }>;
  overall_score: number;
  overall_percentage: number;
  completed_at: string;
  created_at: string;
}

interface ProgressChartsProps {
  userId: string;
  assessmentType: string;
}

export default function ProgressCharts({ userId, assessmentType }: ProgressChartsProps) {
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('growth');

  useEffect(() => {
    fetchAssessmentHistory();
  }, [userId, assessmentType]);

  const fetchAssessmentHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assessment_history')
        .select('*')
        .eq('user_id', userId)
        .eq('assessment_type', assessmentType)
        .order('completed_at', { ascending: true });

      if (error) throw error;
      setAssessmentHistory(data || []);
    } catch (error) {
      console.error('Error fetching assessment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGrowthData = () => {
    return assessmentHistory.map((assessment, index) => ({
      name: `Assessment ${index + 1}`,
      date: formatDate(assessment.completed_at),
      overallScore: assessment.overall_percentage,
      previousScore: index > 0 ? assessmentHistory[index - 1].overall_percentage : null,
      improvement: index > 0 ? assessment.overall_percentage - assessmentHistory[index - 1].overall_percentage : 0
    }));
  };

  const getEffortData = () => {
    // Calculate effort based on frequency of assessments and consistency
    const effortScores = assessmentHistory.map((assessment, index) => {
      const daysSincePrevious = index > 0 
        ? (new Date(assessment.completed_at).getTime() - new Date(assessmentHistory[index - 1].completed_at).getTime()) / (1000 * 60 * 60 * 24)
        : 0;
      
      // Effort score based on consistency (shorter gaps = higher effort)
      let effortScore = 100;
      if (daysSincePrevious > 0) {
        if (daysSincePrevious <= 7) effortScore = 95;
        else if (daysSincePrevious <= 14) effortScore = 85;
        else if (daysSincePrevious <= 30) effortScore = 70;
        else if (daysSincePrevious <= 60) effortScore = 50;
        else effortScore = 30;
      }

      return {
        name: `Assessment ${index + 1}`,
        date: formatDate(assessment.completed_at),
        effortScore,
        daysSincePrevious: Math.round(daysSincePrevious),
        consistency: daysSincePrevious <= 14 ? 'High' : daysSincePrevious <= 30 ? 'Medium' : 'Low'
      };
    });

    return effortScores;
  };

  const getCategoryProgressData = () => {
    if (assessmentHistory.length < 2) return [];

    const latest = assessmentHistory[assessmentHistory.length - 1];
    const previous = assessmentHistory[assessmentHistory.length - 2];

    return latest.category_scores.map(category => {
      const previousCategory = previous.category_scores.find(c => c.category === category.category);
      const improvement = previousCategory ? category.percentage - previousCategory.percentage : 0;

      return {
        category: category.category,
        currentScore: category.percentage,
        previousScore: previousCategory?.percentage || 0,
        improvement,
        trend: improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'stable'
      };
    });
  };

  const calculateOverallGrowth = () => {
    if (assessmentHistory.length < 2) return 0;
    const first = assessmentHistory[0];
    const latest = assessmentHistory[assessmentHistory.length - 1];
    return latest.overall_percentage - first.overall_percentage;
  };

  const calculateEffortScore = () => {
    if (assessmentHistory.length < 2) return 100;
    
    const totalDays = (new Date(assessmentHistory[assessmentHistory.length - 1].completed_at).getTime() - 
                      new Date(assessmentHistory[0].completed_at).getTime()) / (1000 * 60 * 60 * 24);
    const averageDaysBetween = totalDays / (assessmentHistory.length - 1);
    
    if (averageDaysBetween <= 7) return 95;
    if (averageDaysBetween <= 14) return 85;
    if (averageDaysBetween <= 30) return 70;
    if (averageDaysBetween <= 60) return 50;
    return 30;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progress Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assessmentHistory.length < 2) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progress Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">Complete your second assessment to see progress charts</p>
            <p className="text-sm text-gray-500">Track your growth and effort over time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const growthData = getGrowthData();
  const effortData = getEffortData();
  const categoryProgress = getCategoryProgressData();
  const overallGrowth = calculateOverallGrowth();
  const effortScore = calculateEffortScore();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Progress Tracking
        </CardTitle>
        <p className="text-sm text-gray-600">
          Track your growth and effort across {assessmentHistory.length} assessments
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="growth" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Growth Progress
            </TabsTrigger>
            <TabsTrigger value="effort" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Effort Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="space-y-6">
            {/* Overall Growth Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Total Growth</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {overallGrowth > 0 ? '+' : ''}{overallGrowth.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500">
                    Since first assessment
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Best Score</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.max(...assessmentHistory.map(a => a.overall_percentage)).toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500">
                    Highest achievement
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Assessments</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {assessmentHistory.length}
                  </div>
                  <p className="text-xs text-gray-500">
                    Total completed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall Score Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: any) => [`${value}%`, 'Score']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="overallScore" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryProgress.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">
                            {category.category.replace(/-/g, ' ')}
                          </span>
                          <Badge 
                            variant={category.trend === 'up' ? 'default' : category.trend === 'down' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {category.trend === 'up' ? '+' : ''}{category.improvement.toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress 
                          value={category.currentScore} 
                          className="h-2"
                        />
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-medium">{category.currentScore.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">vs {category.previousScore.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="effort" className="space-y-6">
            {/* Effort Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Effort Score</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {effortScore}/100
                  </div>
                  <p className="text-xs text-gray-500">
                    Based on consistency
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium">Avg. Interval</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {assessmentHistory.length > 1 
                      ? Math.round((new Date(assessmentHistory[assessmentHistory.length - 1].completed_at).getTime() - 
                                   new Date(assessmentHistory[0].completed_at).getTime()) / (1000 * 60 * 60 * 24 * (assessmentHistory.length - 1)))
                      : 0} days
                  </div>
                  <p className="text-xs text-gray-500">
                    Between assessments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-medium">Consistency</span>
                  </div>
                  <div className="text-2xl font-bold text-teal-600">
                    {effortScore >= 85 ? 'High' : effortScore >= 60 ? 'Medium' : 'Low'}
                  </div>
                  <p className="text-xs text-gray-500">
                    Assessment frequency
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Effort Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Effort Consistency Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={effortData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: any, name: any) => [
                        name === 'effortScore' ? `${value}/100` : value,
                        name === 'effortScore' ? 'Effort Score' : 'Days Since Previous'
                      ]}
                      labelFormatter={(label) => `Assessment: ${label}`}
                    />
                    <Bar 
                      dataKey="effortScore" 
                      fill="#f97316" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Consistency Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consistency Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {effortData.map((assessment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <div>
                          <div className="font-medium">{assessment.name}</div>
                          <div className="text-sm text-gray-500">{assessment.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{assessment.effortScore}/100</div>
                        <div className="text-sm text-gray-500">
                          {assessment.daysSincePrevious > 0 
                            ? `${assessment.daysSincePrevious} days gap`
                            : 'First assessment'
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 