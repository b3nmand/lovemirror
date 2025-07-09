import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Users, Lock, TrendingUp, Heart, Sparkles, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { getUserRelationships, getLatestCompatibilityScore } from '@/lib/compatibility';
import { getAssessmentHistory } from '@/lib/supabase';
import { getAssessmentType } from '@/lib/assessmentType';
import { useSubscription } from '@/hooks/useSubscription';
import type { Profile } from '@/types/profile';
import type { Relationship } from '@/lib/compatibility';
import { hasActiveSubscription } from '@/lib/subscription';
import { checkBothPartnersCompletedAssessments } from '@/lib/compatibility';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isSubscribed, loading: subscriptionLoading } = useSubscription();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [hasCompatibilityScore, setHasCompatibilityScore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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
        
        // Check if user has completed any assessments
        const { data: assessments } = await getAssessmentHistory(user.id);
        setHasAssessment(assessments && assessments.length > 0);
        
        // Get user relationships
        const { data: userRelationships } = await getUserRelationships();
        setRelationships(userRelationships || []);
        
        // If user has relationships, check if they have compatibility scores
        if (userRelationships && userRelationships.length > 0) {
          const { data: compatibilityData } = await getLatestCompatibilityScore(userRelationships[0].id);
          setHasCompatibilityScore(!!compatibilityData);
          // Remove automatic redirect - let users choose when to view compatibility
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [navigate]);

  if (loading || subscriptionLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const assessmentType = profile ? getAssessmentType(profile) : null;

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8" style={{ 
        background: 'linear-gradient(90deg, #ff0099, #9900ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {profile?.name ? `Welcome, ${profile.name}` : 'Welcome to Love Mirror'}
      </h1>

      {/* Subscription Status Alert */}
      {!isSubscribed && (
        <Alert className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
          <AlertTitle className="text-sm sm:text-base text-pink-800">Unlock Premium Features</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm text-pink-700">
            Subscribe to access detailed assessment results, partner compatibility, external feedback, and personalized improvement plans.
            <div className="mt-2">
              <Button 
                onClick={() => navigate('/subscription')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white [&_svg]:text-white text-xs sm:text-sm"
                size="sm"
              >
                Upgrade Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Cards */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4 sm:mb-6 md:mb-8">
        <Card className="overflow-hidden transition-all hover:shadow-lg">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
              Self-Assessment
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Evaluate your relationship traits
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
              Complete your assessment to discover your strengths and areas for growth.
            </p>
          </CardContent>
          <CardFooter className="bg-gray-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
            <Button
              onClick={() => navigate('/assessment')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white [&_svg]:text-white text-xs sm:text-sm md:text-base"
            >
              {hasAssessment ? 'Retake Assessment' : 'Start Assessment'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-lg">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              Delusional Score
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Get your Delusional Score from people who know you
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
              Invite friends, family or partners to anonymously rate your self-awareness and get your Delusional Score.
            </p>
          </CardContent>
          <CardFooter className="bg-gray-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
            <Button
              onClick={() => {
                if (isSubscribed) {
                  navigate('/assessors');
                } else {
                  const returnUrl = '/assessors';
                  localStorage.setItem('subscriptionReturnUrl', returnUrl);
                  navigate('/subscription');
                }
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white text-xs sm:text-sm md:text-base"
            >
              {isSubscribed ? 'Invite Assessors' : 'Upgrade to Access'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-lg">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
              Partner Compatibility
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Compare your traits with your partner
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
              See how well your traits align with your partner's and identify areas for growth.
            </p>
          </CardContent>
          <CardFooter className="bg-gray-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
            {relationships.length > 0 && hasCompatibilityScore ? (
              <Button
                onClick={() => {
                  if (isSubscribed) {
                    navigate(`/compatibility/${relationships[0].id}`);
                  } else {
                    const returnUrl = `/compatibility/${relationships[0].id}`;
                    localStorage.setItem('subscriptionReturnUrl', returnUrl);
                    navigate('/subscription');
                  }
                }}
                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90 text-white text-xs sm:text-sm md:text-base"
              >
                {isSubscribed ? 'View Compatibility' : 'Upgrade to View'}
              </Button>
            ) : relationships.length > 0 ? (
              <Button
                onClick={() => navigate('/assessment')}
                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90 text-white text-xs sm:text-sm md:text-base"
              >
                Complete Assessment
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (isSubscribed) {
                    navigate('/invite-partner');
                  } else {
                    const returnUrl = '/invite-partner';
                    localStorage.setItem('subscriptionReturnUrl', returnUrl);
                    navigate('/subscription');
                  }
                }}
                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90 text-white text-xs sm:text-sm md:text-base"
              >
                {isSubscribed ? 'Invite Partner' : 'Upgrade to Invite'}
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-lg">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              AI Relationship Mentor
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Get personalized AI-powered relationship advice
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
              Chat with our AI mentor for personalized relationship guidance based on your assessment data.
            </p>
          </CardContent>
          <CardFooter className="bg-gray-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
            <Button
              onClick={() => {
                if (isSubscribed) {
                  navigate('/ai-mentor');
                } else {
                  const returnUrl = '/ai-mentor';
                  localStorage.setItem('subscriptionReturnUrl', returnUrl);
                  navigate('/subscription');
                }
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90 text-white text-xs sm:text-sm md:text-base"
            >
              {isSubscribed ? 'Chat with AI Mentor' : 'Upgrade to Access'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">Relationship Resources</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-center text-xs sm:text-sm">
                <div className="w-2 h-2 rounded-full bg-pink-500 mr-2 sm:mr-3"></div>
                <span>Invite external assessors for more accurate feedback</span>
              </li>
              <li className="flex items-center text-xs sm:text-sm">
                <div className="w-2 h-2 rounded-full bg-pink-500 mr-2 sm:mr-3"></div>
                <span>Take assessments regularly to track your growth</span>
              </li>
              <li className="flex items-center text-xs sm:text-sm">
                <div className="w-2 h-2 rounded-full bg-pink-500 mr-2 sm:mr-3"></div>
                <span>Share results with your partner for better understanding</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-center text-xs sm:text-sm">
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-2 sm:mr-3"></div>
                <span>Be honest in your self-assessments for accurate results</span>
              </li>
              <li className="flex items-center text-xs sm:text-sm">
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-2 sm:mr-3"></div>
                <span>Focus on one improvement area at a time</span>
              </li>
              <li className="flex items-center text-xs sm:text-sm">
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-2 sm:mr-3"></div>
                <span>Discuss compatibility results openly with your partner</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}