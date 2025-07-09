import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import type { Profile } from '@/types/profile';
import type { AssessmentType } from '@/lib/assessmentType';

export interface ExternalAssessor {
  id: string;
  user_id: string;
  email: string;
  relationship: string;
  invitation_code: string;
  status: 'pending' | 'completed';
  assessment_type: AssessmentType | null;
  created_at: string;
  expires_at: string;
  updated_at: string;
}

export type NewAssessorData = {
  email: string;
  relationship: string;
  assessment_type?: AssessmentType | null;
};

// Fetch all external assessors for the current user
export async function getExternalAssessors(): Promise<{ data: ExternalAssessor[], error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('external_assessors')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching external assessors:', error);
    return { data: [], error };
  }
}

// Create a new external assessor invitation
export async function createExternalAssessor(assessorData: NewAssessorData): Promise<{ data: ExternalAssessor | null, error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Generate a unique invitation code client-side
    const invitationCode = nanoid(10); // e.g., "Vx4F9bQt1Z"

    const { data, error } = await supabase
      .from('external_assessors')
      .insert({
        user_id: user.id,
        email: assessorData.email,
        relationship: assessorData.relationship,
        assessment_type: assessorData.assessment_type || null,
        invitation_code: invitationCode,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating external assessor:', error);
    return { data: null, error };
  }
}

// Resend invitation (update the expiration date)
export async function resendInvitation(assessorId: string): Promise<{ success: boolean, error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Set new expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error } = await supabase
      .from('external_assessors')
      .update({
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', assessorId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error resending invitation:', error);
    return { success: false, error };
  }
}

// Remove an external assessor
export async function removeExternalAssessor(assessorId: string): Promise<{ success: boolean, error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('external_assessors')
      .delete()
      .eq('id', assessorId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error removing external assessor:', error);
    return { success: false, error };
  }
}

// Get assessor by invitation code
export async function getAssessorByCode(code: string): Promise<{ data: ExternalAssessor | null, error: any, userProfile?: Profile | null }> {
  try {
    const { data: assessor, error } = await supabase
      .from('external_assessors')
      .select('*')
      .eq('invitation_code', code)
      .single();

    if (error) throw error;

    // Get user profile for additional context
    if (assessor) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', assessor.user_id)
        .single();

      return { data: assessor, error: null, userProfile: profile };
    }

    return { data: assessor, error: null };
  } catch (error) {
    console.error('Error getting assessor by code:', error);
    return { data: null, error };
  }
}

// Update assessor status to completed
export async function completeAssessment(assessorId: string): Promise<{ success: boolean, error: any }> {
  try {
    const { error } = await supabase
      .from('external_assessors')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', assessorId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error completing assessment:', error);
    return { success: false, error };
  }
}

// Get assessment type name for display
export function getAssessmentTypeName(assessmentType: AssessmentType | null): string {
  switch (assessmentType) {
    case 'high-value-man':
      return 'High-Value Man Assessment';
    case 'wife-material':
      return 'Wife Material Assessment';
    case 'bridal-price':
      return 'Bridal Price Estimator';
    default:
      return 'Assessment';
  }
}