import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { acceptInvitation } from '@/lib/compatibility';
import { toast } from 'sonner';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');
  const [isRecovery, setIsRecovery] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  // Check for invitation code in localStorage or URL params
  useEffect(() => {
    // First check localStorage
    const storedCode = localStorage.getItem('pendingInvitationCode');
    if (storedCode) {
      setInvitationCode(storedCode);
      return;
    }

    // Then check URL params
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('invitationCode');
    if (codeFromUrl) {
      setInvitationCode(codeFromUrl);
      localStorage.setItem('pendingInvitationCode', codeFromUrl);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('type') === 'recovery') {
      setIsRecovery(true);
    }
  }, []);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (formData: AuthFormData) => {
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;

        // Check if we need to handle an invitation
        if (invitationCode) {
          handlePendingInvitation(invitationCode);
          return;
        }

        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // Redirect based on profile existence
        navigate(profile ? '/dashboard' : '/profile-setup');
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (signUpError) throw signUpError;

        // Store email in localStorage for profile setup
        localStorage.setItem('userEmail', formData.email);

        // For new registrations, we'll handle the invitation after profile setup
        navigate('/profile-setup');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(activeTab === 'login' ? 'Invalid email or password' : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Handle pending invitation after login/registration
  const handlePendingInvitation = async (code: string) => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      // Get invitation details
      const { data: invitation } = await supabase
        .from('partner_invitations')
        .select('id')
        .eq('invitation_code', code)
        .eq('status', 'pending')
        .single();

      if (invitation) {
        // Accept the invitation
        const { success, error, relationshipId } = await acceptInvitation(invitation.id);
        if (success) {
          toast.success('Partnership invitation accepted');
          // Clear the stored code
          localStorage.removeItem('pendingInvitationCode');
          
          // Check if profile exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();
            
          if (profile) {
            if (relationshipId) {
              navigate(`/compatibility/${relationshipId}`);
            } else {
              navigate('/dashboard');
            }
          } else {
            navigate('/profile-setup');
          }
        } else {
          console.error('Error accepting invitation:', error);
          // Still redirect but don't clear code so it can be tried again
          navigate('/profile-setup');
        }
      } else {
        // If invitation doesn't exist, just redirect normally
        navigate('/profile-setup');
      }
    } catch (error) {
      console.error('Error handling invitation:', error);
      navigate('/profile-setup');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus('idle');
    setResetMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      setResetStatus('success');
      setResetMessage('Password reset email sent! Please check your inbox.');
    } catch (err) {
      setResetStatus('error');
      setResetMessage('Failed to send reset email. Please check the email address and try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold" style={{ 
            background: 'linear-gradient(90deg, #ff0099, #9900ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Welcome to Love Mirror
          </CardTitle>
          <CardDescription>
            {invitationCode ? 
              "Sign in or create an account to connect with your partner" : 
              (activeTab === 'login' ? 'Sign in to your account' : 'Create a new account')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isRecovery ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setRecoveryStatus('idle');
                setRecoveryMessage('');
                const newPassword = recoveryPassword;
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) {
                  setRecoveryStatus('error');
                  setRecoveryMessage('Failed to update password. Please try again.');
                } else {
                  setRecoveryStatus('success');
                  setRecoveryMessage('Password updated! You can now log in.');
                  setTimeout(() => {
                    setIsRecovery(false);
                    setRecoveryPassword('');
                    setRecoveryStatus('idle');
                    setRecoveryMessage('');
                    navigate('/auth');
                  }, 2000);
                }
              }}
              className="space-y-4 mb-6"
            >
              <Input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={recoveryPassword}
                onChange={e => setRecoveryPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              >
                Set New Password
              </Button>
              {recoveryStatus !== 'idle' && (
                <div className={`text-center text-sm mt-2 ${recoveryStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>{recoveryMessage}</div>
              )}
            </form>
          ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {invitationCode && (
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  You've been invited to connect with a partner. Please {activeTab === 'login' ? 'sign in' : 'register'} to continue.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                          <PasswordInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}
                    </div>
                  ) : (
                    activeTab === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </Button>

                {activeTab === 'login' && !showReset && (
                  <div className="text-center mt-2">
                    <button
                      type="button"
                      className="text-sm text-pink-600 hover:underline focus:outline-none"
                      onClick={() => setShowReset(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </form>
            </Form>

            {activeTab === 'login' && showReset && (
              <div className="mt-6">
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-pink-500" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  >
                    Send Reset Email
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setShowReset(false);
                      setResetStatus('idle');
                      setResetMessage('');
                    }}
                  >
                    Cancel
                  </Button>
                  {resetStatus !== 'idle' && (
                    <div className={`text-center text-sm mt-2 ${resetStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>{resetMessage}</div>
                  )}
                </form>
              </div>
            )}
          </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}