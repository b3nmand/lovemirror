import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CalendarIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format, parse, isValid } from 'date-fns';
import { supabase } from '../lib/supabase';
import { profileSchema, type ProfileFormData } from '../lib/validationSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { acceptInvitation } from '@/lib/compatibility';
import { toast } from 'sonner';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dateInputMode, setDateInputMode] = useState<'calendar' | 'text'>('text');
  const [invitationCode, setInvitationCode] = useState<string | null>(null);

  useEffect(() => {
    // Check for invitation code in localStorage
    const storedCode = localStorage.getItem('pendingInvitationCode');
    if (storedCode) {
      setInvitationCode(storedCode);
    }
  }, []);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      dob: undefined,
      gender: undefined,
      region: undefined,
      culturalContext: 'global',
    }
  });

  const handleSubmit = async (formData: ProfileFormData) => {
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
          dob: formData.dob.toISOString(),
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

      navigate('/dashboard');
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold" style={{ 
            background: 'linear-gradient(90deg, #ff0099, #9900ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Complete Your Profile</CardTitle>
          <CardDescription>Tell us about yourself to get personalized insights</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive\" className="mb-6">
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField 
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <FormLabel>Date of Birth</FormLabel>
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
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => handleDateInputChange(e, field.onChange)}
                          placeholder="YYYY-MM-DD"
                        />
                      </FormControl>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem> 
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="africa">Africa</SelectItem>
                        <SelectItem value="asia">Asia</SelectItem> 
                        <SelectItem value="europe">Europe</SelectItem>
                        <SelectItem value="north_america">North America</SelectItem>
                        <SelectItem value="south_america">South America</SelectItem>
                        <SelectItem value="oceania">Oceania</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              /> 
              
              {form.watch('gender') === 'female' && form.watch('region') === 'africa' && (
                <FormField
                  control={form.control}
                  name="culturalContext"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cultural Context</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cultural context" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="global">Global Context</SelectItem>
                          <SelectItem value="african">African Context</SelectItem> 
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}