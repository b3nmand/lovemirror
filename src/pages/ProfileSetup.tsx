import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { acceptInvitation } from '@/lib/compatibility';
import { toast } from 'sonner';

interface ProfileFormData {
  name: string;
  dob: Date | undefined;
  gender: string | undefined;
  region: string | undefined;
  culturalContext: string;
}

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dateInputMode, setDateInputMode] = useState<'calendar' | 'text'>('text');
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    dob: undefined,
    gender: undefined,
    region: undefined,
    culturalContext: 'global',
  });

  useEffect(() => {
    // Check for invitation code in localStorage
    const storedCode = localStorage.getItem('pendingInvitationCode');
    if (storedCode) {
      setInvitationCode(storedCode);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No user found. Please sign in again.');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: formData.name,
          dob: formData.dob?.toISOString(),
          gender: formData.gender,
          region: formData.region,
          cultural_context: formData.culturalContext,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;
      
      // Handle invitation if present
      if (invitationCode) {
        try {
          // Get invitation details
          const { data: invitation } = await supabase
            .from('partner_invitations')
            .select('id')
            .eq('invitation_code', invitationCode)
            .eq('status', 'pending')
            .single();
  
          if (invitation) {
            // Accept the invitation
            const { success, error } = await acceptInvitation(invitation.id);
            if (success) {
              toast.success('Partnership invitation accepted');
              // Clear the stored code
              localStorage.removeItem('pendingInvitationCode');
            } else {
              console.error('Error accepting invitation:', error);
            }
          }
        } catch (invitationError) {
          console.error('Error processing invitation:', invitationError);
        }
      }

      toast.success('Profile created successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (!inputValue) {
      setFormData(prev => ({ ...prev, dob: undefined }));
      return;
    }
    
    // Try to parse the date (accepting multiple formats)
    let parsedDate: Date | undefined;
    
    // First try the standard yyyy-MM-dd format
    parsedDate = parse(inputValue, 'yyyy-MM-dd', new Date());
    
    // If that fails, try common alternative formats
    if (!isValid(parsedDate)) {
      // Try dd/MM/yyyy format
      parsedDate = parse(inputValue, 'dd/MM/yyyy', new Date());
    }
    
    if (!isValid(parsedDate)) {
      // Try MM/dd/yyyy format
      parsedDate = parse(inputValue, 'MM/dd/yyyy', new Date());
    }
    
    if (!isValid(parsedDate)) {
      // Try yyyy/MM/dd format
      parsedDate = parse(inputValue, 'yyyy/MM/dd', new Date());
    }
    
    if (isValid(parsedDate)) {
      // Ensure the date is not in the future
      if (parsedDate > new Date()) {
        setFormData(prev => ({ ...prev, dob: undefined }));
        return;
      }
      setFormData(prev => ({ ...prev, dob: parsedDate }));
    }
  };

  const toggleDateInputMode = () => {
    setDateInputMode(prev => prev === 'calendar' ? 'text' : 'calendar');
  };

  const updateFormData = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center px-4 sm:px-6 pt-6 sm:pt-8">
          <CardTitle className="text-2xl sm:text-3xl font-bold" style={{ 
            background: 'linear-gradient(90deg, #ff0099, #9900ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Complete Your Profile</CardTitle>
          <CardDescription className="text-sm sm:text-base">Tell us about yourself to get personalized insights</CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {invitationCode && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                After setting up your profile, you'll be connected with your partner.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <Input 
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleDateInputMode}
                  className="text-xs bg-transparent hover:bg-gray-50 text-gray-700 border-gray-200"
                >
                  {dateInputMode === 'text' ? '📅 Use Calendar' : '✏️ Type Manually'}
                </Button>
              </div>
              
              {dateInputMode === 'text' ? (
                <Input 
                  type="text" 
                  value={formData.dob ? format(formData.dob, 'dd/MM/yyyy') : ''}
                  onChange={handleDateInputChange}
                  placeholder="DD/MM/YYYY (e.g., 15/08/1990)"
                  className="font-mono"
                />
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full pl-3 text-left font-normal ${!formData.dob && "text-muted-foreground"}`}
                    >
                      {formData.dob ? (
                        format(formData.dob, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dob}
                      onSelect={(date) => updateFormData('dob', date)}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                You can type dates in DD/MM/YYYY format or use the calendar picker
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <Select
                value={formData.gender}
                onValueChange={(value) => updateFormData('gender', value)}
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <Select
                value={formData.region}
                onValueChange={(value) => updateFormData('region', value)}
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
            
            {formData.gender === 'female' && formData.region === 'africa' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cultural Context
                </label>
                <Select
                  value={formData.culturalContext}
                  onValueChange={(value) => updateFormData('culturalContext', value)}
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
            
            <Button
              type="submit" 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Setting Up Your Profile...
                </div>
              ) : ( 
                'Continue to Dashboard'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}