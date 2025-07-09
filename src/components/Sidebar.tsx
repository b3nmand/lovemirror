import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Target, BookOpen, Settings as SettingsIcon, Users, Award, Crown, Diamond, Scale, LogIn, LogOut, Mail, UserCheck, UserPlus, Heart, Menu, X, TrendingUp, Sparkles, Brain } from 'lucide-react';
import { AssessmentScores } from './AssessmentScores';
import { supabase } from '../lib/supabase';
import { getAssessmentType } from '../lib/assessmentType';
import { getUserRelationships, getLatestCompatibilityScore } from '../lib/compatibility';
import type { Profile } from '../types/profile';
import { Ad } from './Ad';
import { ConnectionStatus } from './ui/connection-status';
import { SubscriptionStatus } from './SubscriptionStatus';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { hasActiveSubscription } from '@/lib/subscription';

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

export function Sidebar({ isMobile = false, isOpen = false, onClose, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  const [emailVerified, setEmailVerified] = useState(true);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [hasCompatibilityScore, setHasCompatibilityScore] = useState(false);
  const [partnerIsSubscribed, setPartnerIsSubscribed] = useState(false);
  const [canViewCompatibility, setCanViewCompatibility] = useState(false);

  useEffect(() => {
    checkUser();
    fetchUserProfile();
    fetchAssessmentHistory();
    fetchRelationships();
  }, []);

  const fetchRelationships = async () => {
    try {
      const { data, error } = await getUserRelationships();
      if (error) {
        console.error('Error fetching relationships:', error);
        return;
      }
      setRelationships(data || []);
      if (data && data.length > 0) {
        // Check if there's a compatibility score for the first relationship
        const { data: compatibilityData } = await getLatestCompatibilityScore(data[0].id);
        setHasCompatibilityScore(!!compatibilityData);
        // Check subscription status for both users
        const currentUserId = data[0].user1_id === user?.id ? data[0].user1_id : data[0].user2_id;
        const partnerId = data[0].user1_id === user?.id ? data[0].user2_id : data[0].user1_id;
        const currentUserSubscribed = await hasActiveSubscription(currentUserId);
        const partnerSubscribed = await hasActiveSubscription(partnerId);
        setPartnerIsSubscribed(partnerSubscribed);
        setCanViewCompatibility(currentUserSubscribed && (partnerSubscribed || currentUserSubscribed));
      } else {
        setPartnerIsSubscribed(false);
        setCanViewCompatibility(false);
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
    }
  };

  const fetchAssessmentHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (assessmentError) {
        console.error('Error fetching assessment history:', assessmentError);
      } else {
        setAssessmentHistory(assessmentData || []);
      }
    } catch (error) {
      console.error('Error fetching assessment history:', error);
    }
  };

  const getLatestAssessmentId = (type: string) => {
    const assessment = assessmentHistory.find(a => a.assessment_type === type);
    return assessment?.id;
  };

  const hasCompletedAssessment = (type: string) => {
    return assessmentHistory.some(a => a.assessment_type === type);
  };

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setEmailVerified(!!currentUser.email_confirmed_at);
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  if (!user) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-pink-50 w-64 fixed left-0 top-0 shadow-md">
        <LogIn className="w-12 h-12 mb-4 text-pink-600" />
        <h2 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">Welcome Back</h2>
        <Button
          onClick={() => navigate('/auth')}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Sign In
        </Button>
      </div>
    );
  }

  const sidebarClasses = `
    ${isMobile 
      ? 'fixed inset-y-0 left-0 z-40 w-full sm:w-80 transform transition-transform duration-300 ease-in-out'
      : 'hidden lg:block fixed top-0 left-0 h-full w-64'}
    ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
    bg-white shadow-lg
  `;

  const overlayClasses = `
    fixed inset-0 bg-black/50 z-30 transition-all duration-300 ease-in-out
    ${isMobile && isOpen ? 'opacity-100 backdrop-blur-[2px]' : 'opacity-0 pointer-events-none backdrop-blur-none'}
  `;

  const activeButtonClass = "bg-gradient-to-r from-pink-50 to-purple-50 text-gray-900 font-medium border-r-4 border-pink-500";
  const inactiveButtonClass = "bg-white text-gray-700 hover:bg-gray-50";

  return (
    <>
      {isMobile && <div className={overlayClasses} onClick={onClose} />}
      <Card className={sidebarClasses}>
        <ScrollArea className="h-full">
          <div className="h-full p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
                Love Mirror
              </h2>
            </div>
            
            {/* Subscription Status */}
            <div className="mb-3 sm:mb-4 flex justify-between items-center">
              <SubscriptionStatus showDetails={true} />
              <Button
                size="sm"
                onClick={() => navigate('/subscription')}
                className="text-xs h-6 sm:h-8 px-2 sm:px-3 border border-purple-400 text-black bg-white font-medium rounded-md shadow-none focus:outline-none focus:ring-2 focus:ring-purple-300 flex items-center gap-1"
                style={{ boxShadow: 'none' }}
              >
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-pink-500" />
                Upgrade
              </Button>
            </div>
            
            <nav>
              <ul className="space-y-1">
                <li>
                  <Button
                    variant={isActive('/dashboard') ? "secondary" : "ghost"}
                    className={`w-full justify-start rounded-lg transition-all text-xs sm:text-sm ${isActive('/dashboard') ? activeButtonClass : inactiveButtonClass}`}
                    onClick={() => handleNavigation('/dashboard')}
                  >
                    <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${isActive('/dashboard') ? "text-pink-600" : ""}`} />
                    <span className="font-medium">Dashboard</span>
                  </Button>
                </li>

                {profile && <li className="pt-2">
                  <div className="px-3 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {profile.gender === 'male' ? 'High-Value Assessment' : 'Relationship Assessment'}
                  </div>
                  <div className="mt-2 space-y-1">
                    {profile.gender === 'male' && (
                      <button
                        onClick={() => handleNavigation('/assessment?type=high-value-man')}
                        className={`flex items-center px-3 sm:px-4 py-2 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                          location.search.includes('type=high-value-man')
                            ? activeButtonClass
                            : inactiveButtonClass
                        }`}
                      >
                        <Scale className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                        <span className="font-medium">High-Value Man</span>
                      </button>
                    )}
                    
                    {profile.gender === 'female' && (
                      <>
                        <button
                          onClick={() => handleNavigation('/assessment?type=bridal-price')}
                          className={`flex items-center px-3 sm:px-4 py-2 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                            location.search.includes('type=bridal-price')
                              ? activeButtonClass
                              : inactiveButtonClass
                          }`}
                        >
                          <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                          <span className="font-medium">Bridal Price Estimator</span>
                        </button>

                        <button
                          onClick={() => handleNavigation('/assessment?type=wife-material')}
                          className={`flex items-center px-3 sm:px-4 py-2 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                            location.search.includes('type=wife-material')
                              ? activeButtonClass
                              : inactiveButtonClass
                          }`}
                        >
                          <Diamond className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                          <span className="font-medium">Wife Material</span>
                        </button>
                      </>
                    )}
                  </div>
                </li>}

                {profile && assessmentHistory.length > 0 && (
                  <li className="pt-2">
                    <div className="px-3 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {profile.gender === 'male' ? 'High-Value Results' : 'Assessment Results'}
                    </div>
                    <div className="mt-2 space-y-1">
                      {profile.gender === 'male' && hasCompletedAssessment('high-value-man') && (
                        <button
                          onClick={() => handleNavigation(`/high-value-results/${getLatestAssessmentId('high-value-man')}`)}
                          className={`flex items-center px-3 sm:px-4 py-2 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                            location.pathname.includes('/high-value-results')
                              ? activeButtonClass
                              : inactiveButtonClass
                          }`}
                        >
                          <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 ${location.pathname.includes('/high-value-results') ? "text-blue-600" : ""}`} />
                          <span className="font-medium">High-Value Results</span>
                        </button>
                      )}
                      
                      {profile.gender === 'female' && (
                        <>
                          {hasCompletedAssessment('bridal-price') && (
                            <button
                              onClick={() => handleNavigation(`/bridal-price-results/${getLatestAssessmentId('bridal-price')}`)}
                              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                                location.pathname.includes('/bridal-price-results')
                                  ? activeButtonClass
                                  : inactiveButtonClass
                              }`}
                            >
                              <Crown className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 ${location.pathname.includes('/bridal-price-results') ? "text-pink-600" : ""}`} />
                              <span className="font-medium">Bridal Price Results</span>
                            </button>
                          )}
                          
                          {hasCompletedAssessment('wife-material') && (
                            <button
                              onClick={() => handleNavigation(`/wife-material-results/${getLatestAssessmentId('wife-material')}`)}
                              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                                location.pathname.includes('/wife-material-results')
                                  ? activeButtonClass
                                  : inactiveButtonClass
                              }`}
                            >
                              <Diamond className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 ${location.pathname.includes('/wife-material-results') ? "text-violet-600" : ""}`} />
                              <span className="font-medium">Wife Material Results</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                )}

                {relationships.length > 0 && hasCompatibilityScore && (
                  <li className="pt-2">
                    <div className="px-3 sm:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Relationship
                    </div>
                    <div className="mt-2 space-y-1">
                      <button
                        onClick={() => handleNavigation(`/compatibility/${relationships[0].id}`)}
                        className={`flex items-center px-3 sm:px-4 py-2 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                          location.pathname.includes('/compatibility')
                            ? activeButtonClass
                            : inactiveButtonClass
                        }`}
                      >
                        <Heart className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 ${location.pathname.includes('/compatibility') ? "text-pink-600" : ""}`} />
                        <span className="font-medium">Compatibility</span>
                      </button>
                    </div>
                  </li>
                )}

                <li>
                  <button
                    onClick={() => handleNavigation('/invite-partner')}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                      isActive('/invite-partner')
                        ? activeButtonClass
                        : inactiveButtonClass
                    }`}
                  >
                    <UserPlus className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${isActive('/invite-partner') ? "text-pink-600" : ""}`} />
                    <span className="font-medium">Invite Partner</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNavigation('/assessors')}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                      isActive('/assessors')
                        ? activeButtonClass
                        : inactiveButtonClass
                    }`}
                  >
                    <Users className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${isActive('/assessors') ? "text-pink-600" : ""}`} />
                    <span className="font-medium">External Assessors</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNavigation('/external-results')}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                      location.pathname.includes('/external-results')
                        ? activeButtonClass
                        : inactiveButtonClass
                    }`}
                  >
                    <UserCheck className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${location.pathname.includes('/external-results') ? "text-pink-600" : ""}`} />
                    <span className="font-medium">External Feedback</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNavigation('/self-improvement')}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                      isActive('/self-improvement')
                        ? activeButtonClass
                        : inactiveButtonClass
                    }`}
                  >
                    <Target className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${isActive('/self-improvement') ? "text-pink-600" : ""}`} />
                    <span className="font-medium">Self-Improvement</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/education')}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                      isActive('/education')
                        ? activeButtonClass
                        : inactiveButtonClass
                    }`}
                  >
                    <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${isActive('/education') ? "text-pink-600" : ""}`} />
                    <span className="font-medium">Education</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/ai-mentor')}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                      isActive('/ai-mentor')
                        ? activeButtonClass
                        : inactiveButtonClass
                    }`}
                  >
                    <Brain className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${isActive('/ai-mentor') ? "text-pink-600" : ""}`} />
                    <span className="font-medium">AI Mentor</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/goals')}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                      isActive('/goals')
                        ? activeButtonClass
                        : inactiveButtonClass
                    }`}
                  >
                    <Award className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${isActive('/goals') ? "text-pink-600" : ""}`} />
                    <span className="font-medium">Goals</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/settings')}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                      isActive('/settings')
                        ? activeButtonClass
                        : inactiveButtonClass
                    }`}
                  >
                    <SettingsIcon className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${isActive('/settings') ? "text-pink-600" : ""}`} />
                    <span className="font-medium">Settings</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/subscription')}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full text-left transition-all text-xs sm:text-sm ${
                      isActive('/subscription')
                        ? activeButtonClass
                        : inactiveButtonClass
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${isActive('/subscription') ? "text-pink-600" : ""}`} />
                    <span className="font-medium">Subscription</span>
                  </button>
                </li>
                {!emailVerified && (
                  <li>
                    <button
                      onClick={() => handleNavigation('/settings')}
                      className="flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full text-left bg-amber-50 text-amber-700 transition-all hover:bg-amber-100 text-xs sm:text-sm"
                    >
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                      <span className="font-medium">Verify Email</span>
                    </button>
                  </li>
                )}
                <li className="mt-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full text-left bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all text-xs sm:text-sm"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </ScrollArea>
      </Card>
    </>
  );
}