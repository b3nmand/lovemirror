import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Bell,
  Shield,
  CreditCard, 
  LogOut, 
  Save, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Mail, 
  Send,
  Key,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ManageSubscription } from '@/components/ManageSubscription';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';
import type { Profile } from '@/types/profile';
import { PasswordInput } from '@/components/ui/password-input';

// Define types for our component
interface SettingsFormData {
  name: string;
  email: string;
  dob: Date | undefined;
  gender: string;
  region: string;
  cultural_context: string;
  notifications: boolean;
  currency: string;
  regional_pricing: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  const [dateInputMode, setDateInputMode] = useState<'calendar' | 'text'>('text');
  const [activeTab, setActiveTab] = useState('profile');
  const [subscription, setSubscription] = useState<any>(null);
  const [formData, setFormData] = useState<SettingsFormData>({
    name: '',
    email: '',
    dob: undefined,
    gender: '',
    region: '',
    cultural_context: 'global',
    notifications: true,
    currency: 'USD',
    regional_pricing: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Check for success/canceled params from Stripe checkout
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
    
    const success = searchParams.get('success');
    if (success === 'true') {
      toast.success('Payment successful! Your subscription is now active.');
    }
    
    const canceled = searchParams.get('canceled');
    if (canceled === 'true') {
      toast.info('Payment canceled. Your subscription has not been changed.');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Check if email is verified
      setEmailVerified(!!user.email_confirmed_at);

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Set profile data
      setProfile(profileData);
      
      // Format date for the form
      const dobDate = profileData?.dob ? new Date(profileData.dob) : undefined;
      
      setFormData({
        name: profileData?.name || '',
        email: user.email || '',
        dob: dobDate,
        gender: profileData?.gender || '',
        region: profileData?.region || '',
        cultural_context: profileData?.cultural_context || 'global',
        notifications: true,
        currency: 'USD',
        regional_pricing: true,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // In a real app, this would fetch subscription data from Stripe
      // For demo purposes, set a mock subscription
      setSubscription({
        id: 'sub_demo123456',
        status: 'active',
        plan: 'premium',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancel_at_period_end: false,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
      });
      
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (date: Date | undefined) => void) => {
    const inputValue = e.target.value;
    
    if (!inputValue) {
      onChange(undefined);
      return;
    }
    
    // Try to parse the date (accepting multiple formats)
    const parsedDate = parse(inputValue, 'yyyy-MM-dd', new Date());
    
    if (isValid(parsedDate)) {
      onChange(parsedDate);
    }
  };

  const toggleDateInputMode = () => {
    setDateInputMode(prev => prev === 'calendar' ? 'text' : 'calendar');
  };

  const handleSaveProfile = async () => {
    try {
      setError('');
      setSuccess('');
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      if (!formData.dob) {
        throw new Error('Date of birth is required');
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          dob: formData.dob.toISOString(),
          gender: formData.gender,
          region: formData.region,
          cultural_context: formData.cultural_context,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setSuccess('Settings saved successfully');
      toast.success('Profile updated successfully');
      
      // Refresh profile data
      fetchUserData();
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setVerifyingEmail(true);
      setError('');
      setSuccess('');
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (error) throw error;
      
      setSuccess('Verification email has been sent. Please check your inbox.');
      toast.success('Verification email sent');
    } catch (err) {
      console.error('Error sending verification email:', err);
      setError('Failed to send verification email. Please try again.');
      toast.error('Failed to send verification email');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setError('');
      setSuccess('');
      setSaving(true);

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      setSuccess('Password changed successfully');
      toast.success('Password changed successfully');
      setShowPasswordDialog(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password');
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setError('');
      setSuccess('');
      setSaving(true);

      // 1. Delete user's profile data from the 'profiles' table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile?.id);

      if (profileError) throw profileError;

      // 2. Delete the user from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(profile?.id);
      if (authError) throw authError;

      // 3. Sign out and redirect to home page
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account');
      toast.error('Failed to delete account');
    } finally {
      setSaving(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <Card className="text-center mb-8 bg-white/80 backdrop-blur-sm border-none">
          <CardHeader>
            <User className="w-16 h-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl" style={{ 
              background: 'linear-gradient(90deg, #ff0099, #9900ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Account Settings</CardTitle>
            <CardDescription className="text-lg">
              Manage your profile, preferences, and account settings
            </CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full rounded-lg overflow-hidden mb-6">
            {['Profile', 'Notifications', 'Subscription', 'Account'].map(tab => (
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

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={toggleDateInputMode}
                        className="text-xs"
                      >
                        {dateInputMode === 'text' ? 'Use Calendar' : 'Type Directly'}
                      </Button>
                    </div>
                    
                    {dateInputMode === 'text' ? (
                      <Input 
                        id="dob"
                        type="date" 
                        value={formData.dob ? format(formData.dob, 'yyyy-MM-dd') : ''}
                        onChange={(e) => handleDateInputChange(e, (date) => setFormData(prev => ({ ...prev, dob: date })))}
                        placeholder="YYYY-MM-DD"
                      />
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="dob"
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${!formData.dob && "text-muted-foreground"}`}
                          >
                            {formData.dob ? (
                              format(formData.dob, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={formData.dob}
                            onSelect={(date) => setFormData(prev => ({ ...prev, dob: date || undefined }))}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleSelectChange('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Select
                      value={formData.region}
                      onValueChange={(value) => handleSelectChange('region', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="africa">Africa</SelectItem>
                        <SelectItem value="asia">Asia</SelectItem>
                        <SelectItem value="europe">Europe</SelectItem>
                        <SelectItem value="north_america">North America</SelectItem>
                        <SelectItem value="south_america">South America</SelectItem>
                        <SelectItem value="oceania">Oceania</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.region === 'africa' && (
                    <div className="space-y-2">
                      <Label htmlFor="cultural_context">Cultural Context</Label>
                      <Select
                        value={formData.cultural_context}
                        onValueChange={(value) => handleSelectChange('cultural_context', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cultural context" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global Context</SelectItem>
                          <SelectItem value="african">African Context</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications about your assessments and results
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={formData.notifications}
                      onCheckedChange={(checked) => handleSwitchChange('notifications', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="regional_pricing">Regional Pricing</Label>
                      <p className="text-sm text-muted-foreground">
                        Adjust pricing based on your region
                      </p>
                    </div>
                    <Switch
                      id="regional_pricing"
                      checked={formData.regional_pricing}
                      onCheckedChange={(checked) => handleSwitchChange('regional_pricing', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="currency">Preferred Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleSelectChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                        <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                        <SelectItem value="ZAR">South African Rand (ZAR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Alert className="bg-amber-50 border-amber-100">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Notification settings are currently in development. These preferences will be saved but may not affect all functionality yet.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            {subscription ? (
              <ManageSubscription 
                subscription={subscription} 
                onUpdateSubscription={fetchUserData} 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Choose a Subscription Plan</CardTitle>
                  <CardDescription>
                    Subscribe to unlock premium features and enhance your experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <SubscriptionPlans />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your account security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-medium">Email Address</h3>
                      <p className="text-sm text-muted-foreground">{formData.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {emailVerified ? 
                          <span className="text-green-500 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> Verified
                          </span> : 
                          <span className="text-amber-500 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" /> Not verified
                          </span>
                        }
                      </p>
                    </div>
                    {!emailVerified && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={verifyingEmail}
                      >
                        {verifyingEmail ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Verify Email
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-medium">Password</h3>
                      <p className="text-sm text-muted-foreground">Last updated: Never</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowPasswordDialog(true)}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Change
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Account Management</h3>
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="outline" 
                        onClick={handleSignOut}
                        className="justify-start"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 justify-start"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Change Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and a new password to update your credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={saving}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={saving}
                variant="destructive"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}