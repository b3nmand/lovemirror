import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { createExternalAssessor, type NewAssessorData } from '@/lib/assessors';
import { sendInvitationEmail } from '@/lib/email';
import { supabase } from '@/lib/supabase';
import { getAssessmentType, type AssessmentType } from '@/lib/assessmentType';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Profile } from '@/types/profile';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  relationship: z.string().min(1, 'Please select a relationship'),
  assessmentType: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteAssessorProps {
  onSuccess: () => void;
}

export function InviteAssessor({ onSuccess }: InviteAssessorProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [defaultAssessmentType, setDefaultAssessmentType] = useState<AssessmentType | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(profileData);
        
        if (profileData) {
          const assessmentType = getAssessmentType(profileData);
          setDefaultAssessmentType(assessmentType);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    }

    fetchUserProfile();
  }, []);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      relationship: '',
      assessmentType: '',
    },
  });

  useEffect(() => {
    if (defaultAssessmentType) {
      form.setValue('assessmentType', defaultAssessmentType);
    }
  }, [defaultAssessmentType, form]);

  const handleSubmit = async (data: InviteFormData) => {
    setLoading(true);
    try {
      const assessorData: NewAssessorData = {
        email: data.email,
        relationship: data.relationship,
        assessment_type: data.assessmentType as AssessmentType || defaultAssessmentType,
      };

      const { data: newAssessor, error } = await createExternalAssessor(assessorData);
      
      if (error) {
        console.error('Error creating assessor:', error);
        throw error;
      }

      if (!newAssessor) {
        throw new Error('Failed to create assessor invitation');
      }

      // Get user profile for sender name
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
        
      const senderName = profileData?.name || 'Someone you know';
      
      // Send email invitation
      if (newAssessor) {
        try {
          const { success, error: emailError } = await sendInvitationEmail(
            newAssessor.invitation_code,
            data.email,
            'assessor',
            senderName
          );

          if (!success) {
            console.error('Email sending failed:', emailError);
            toast.warning('Invitation created, but email could not be sent. You can copy the link and send it manually.');
          } else {
            toast.success('Invitation sent successfully');
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          toast.warning('Invitation created, but email could not be sent. You can copy the link and send it manually.');
        }
      }

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get the available assessment types based on gender
  const getAssessmentTypeOptions = () => {
    if (!profile) return [];

    if (profile.gender === 'male') {
      return [{ value: 'high-value-man', label: 'High-Value Man Assessment' }];
    } else if (profile.gender === 'female') {
      return [
        { value: 'wife-material', label: 'Wife Material Assessment' },
        { value: 'bridal-price', label: 'Bridal Price Estimator' }
      ];
    }

    return [];
  };

  const assessmentTypeOptions = getAssessmentTypeOptions();

  return (
    <Card className="bg-gradient-to-br from-white to-pink-50/30 shadow-md border-pink-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">Invite External Assessor</CardTitle>
        <CardDescription>
          Invite someone who knows you well to provide an external assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="family">Family Member</SelectItem>
                      <SelectItem value="partner">Romantic Partner</SelectItem>
                      <SelectItem value="colleague">Colleague</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {profile && profile.gender === 'female' && (
              <FormField
                control={form.control}
                name="assessmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || defaultAssessmentType || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assessment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assessmentTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700 text-sm">
                After inviting, you'll be able to <strong>copy a link</strong> to share directly with your assessor.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Invitation...
                </>
              ) : (
                'Create Invitation'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}