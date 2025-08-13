import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, Sparkles, Brain, MessageCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';
import { getHybridAIResponse, getAIStatus, generateFallbackResponse } from '@/lib/aiService';
import type { Profile } from '@/types/profile';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UserContext {
  profile: Profile | null;
  assessmentScores: Record<string, number>;
  delusionalScore: number | null;
  compatibilityScore: number | null;
}

export default function AIRelationshipMentor() {
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiServiceStatus, setAiServiceStatus] = useState<{ isAvailable: boolean; message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user data and check AI service status on component mount
  useEffect(() => {
    loadUserData();
    checkAIServiceStatus();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAIServiceStatus = async () => {
    try {
      const status = await getAIStatus();
      setAiServiceStatus(status);
    } catch (error) {
      console.error('Error checking AI service status:', error);
      setAiServiceStatus({
        isAvailable: false,
        message: 'Unable to check AI service status.',
      });
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Get latest assessment scores
      const { data: assessmentHistory } = await supabase
        .from('assessment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Get delusional score from external assessments
      const { data: externalResults } = await supabase
        .from('external_assessment_results')
        .select('delusional_score')
        .eq('user_id', user.id)
        .not('delusional_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      // Get compatibility score
      const { data: compatibilityScores } = await supabase
        .from('compatibility_scores')
        .select('overall_percentage')
        .order('created_at', { ascending: false })
        .limit(1);

      setUserContext({
        profile,
        assessmentScores: assessmentHistory?.[0]?.category_scores || {},
        delusionalScore: externalResults?.[0]?.delusional_score || null,
        compatibilityScore: compatibilityScores?.[0]?.overall_percentage || null,
      });

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Log user message and context
      console.log('[LOG] User message:', userMessage);
      console.log('[LOG] User context:', userContext);
      console.log('[LOG] Chat history:', messages);

      // Get hybrid AI response
      const aiResponse = await generateAIResponse(inputValue, userContext);
      
      // Log AI response
      console.log('[LOG] AI response:', aiResponse);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[ERROR] Error generating AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generateAIResponse = async (userInput: string, context: UserContext | null): Promise<string> => {
    try {
      // Check if AI service is available
      if (!aiServiceStatus?.isAvailable) {
        console.log('[AI Mentor] Using fallback response - AI service unavailable');
        return generateFallbackResponse(userInput, context);
      }

      // Prepare chat history for context
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get hybrid AI response (AI first, fallback to book chapters)
      const result = await getHybridAIResponse({
        userInput,
        userContext: {
          profile: {
            name: context?.profile?.name || 'User',
            gender: context?.profile?.gender || 'Not specified',
            region: context?.profile?.region || 'Not specified',
            cultural_context: context?.profile?.cultural_context || 'global',
          },
          assessmentScores: context?.assessmentScores || {},
          delusionalScore: context?.delusionalScore || null,
          compatibilityScore: context?.compatibilityScore || null,
        },
        chatHistory,
      });

      if (result.success && result.response) {
        return result.response;
      } else {
        console.warn('[AI Mentor] Hybrid AI service returned error, using fallback:', result.error);
        return generateFallbackResponse(userInput, context);
      }

    } catch (error) {
      console.error('[AI Mentor] Error calling hybrid AI service:', error);
      return generateFallbackResponse(userInput, context);
    }
  };



  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="container mx-auto p-3 sm:p-4 md:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-pink-500" />
            <CardTitle className="text-xl sm:text-2xl">AI Relationship Mentor</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <Brain className="h-4 w-4" />
                          <AlertDescription>
              Get personalized AI-powered relationship advice with book chapter fallback based on your assessment results and profile.
              Upgrade to premium to access this feature.
            </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/subscription')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              Upgrade to Access AI Mentor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 sm:gap-2 p-2"
            size="sm"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Back</span>
          </Button>
          <div className="flex items-center gap-1 sm:gap-2">
            <Bot className="w-4 h-4 sm:w-6 sm:h-6 text-pink-500" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold">AI Relationship Mentor</h1>
          </div>
        </div>

        {/* User Context Card */}
        {userContext && (
          <Card className="mb-3 sm:mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                Your Profile Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div className="font-medium text-xs sm:text-sm">{userContext.profile?.name || 'Not set'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Gender</div>
                  <div className="font-medium text-xs sm:text-sm">{userContext.profile?.gender || 'Not set'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Delusional Score</div>
                  <div className="font-medium text-xs sm:text-sm">
                    {userContext.delusionalScore ? `${userContext.delusionalScore}/10` : 'N/A'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Compatibility</div>
                  <div className="font-medium text-xs sm:text-sm">
                    {userContext.compatibilityScore ? `${userContext.compatibilityScore}%` : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Service Status */}
        {aiServiceStatus && (
          <Alert className={`mb-3 sm:mb-4 ${aiServiceStatus.isAvailable ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <div className="flex items-center gap-2">
              {aiServiceStatus.isAvailable ? (
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
              )}
              <AlertDescription className="text-xs">
                {aiServiceStatus.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Chat Interface */}
        <Card className="flex flex-col h-[calc(100vh-300px)] sm:h-[calc(100vh-400px)] max-h-[600px] overflow-hidden">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat with AI Mentor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
            {/* Messages Area */}
            <ScrollArea className="flex-1 px-3 sm:px-4 overflow-hidden">
              <div className="space-y-3 py-3 w-full">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-6">
                    <Bot className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-xs sm:text-sm">
                      Ask me anything about relationships, communication, or personal growth!
                    </p>
                    <p className="text-xs mt-1">
                      I'll use AI with book knowledge, and fall back to book chapters if needed.
                    </p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-2 py-2 text-xs sm:text-sm ${
                        message.role === 'user'
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {message.role === 'user' ? (
                          <User className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <Bot className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span className="text-xs opacity-70 flex-shrink-0">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap break-words break-all leading-relaxed overflow-hidden word-break-all">{message.content}</div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start w-full">
                    <div className="bg-gray-100 rounded-lg px-2 py-2 max-w-[85%] sm:max-w-[75%]">
                      <div className="flex items-center gap-2">
                        <Bot className="w-3 h-3 flex-shrink-0" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-2 sm:p-3 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your relationship question..."
                  className="flex-1 text-xs sm:text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-pink-500 hover:bg-pink-600 px-3"
                  size="sm"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>

                {/* Quick Questions */}
        <Card className="mt-3 sm:mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm">Quick Questions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
              {[
                "How can I improve communication?",
                "What does my delusional score mean?",
                "How can I build more trust?",
                "What are signs of a healthy relationship?",
                "How do I handle conflicts better?",
                "What should I focus on based on my assessment?"
              ].map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue(question)}
                  className="text-xs h-auto p-2 text-left justify-start leading-tight"
                >
                  {question}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 