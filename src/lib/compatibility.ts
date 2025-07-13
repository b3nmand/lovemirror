import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import { CategoryScore } from '@/lib/scores';

// Define types for compatibility system
export interface PartnerInvitation {
  id: string;
  sender_id: string;
  invitation_code: string;
  email: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  updated_at: string;
  sender_email?: string | null;
}

export interface Relationship {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  partner_name?: string;
  partner_email?: string;
  partner_id?: string;
}

export interface CompatibilityScore {
  id: string;
  relationship_id: string;
  category_scores: CategoryCompatibility[];
  overall_score: number;
  overall_percentage: number;
  analysis_date: string;
  created_at: string;
}

export interface CategoryCompatibility {
  category: string;
  user1_score: number;
  user2_score: number;
  normalized_user1: number;
  normalized_user2: number;
  match_percentage: number;
}

export interface CompatibilityScoreSummary {
  overall_score: number;
  overall_percentage: number;
  category_scores: Record<string, CategoryCompatibility>;
  analysis_date: string;
  created_at: string;
}

export interface PartnerAssessment {
  user_id: string;
  assessment_type: string;
  category_scores: CategoryScore[];
  overall_score: number;
  overall_percentage: number;
  completed_at: string;
}

// Generate an invitation code
export async function createPartnerInvitation(email: string | null): Promise<{ data: PartnerInvitation | null, error: any }> {
  try {
    // 1) Get current user
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    // 2) Generate a unique code client-side
    const invitationCode = nanoid(10); // e.g. "Vx4F9bQt1Z"

    // 3) Compute expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 4) Insert & explicitly select every column
    const { data, error } = await supabase
      .from('partner_invitations')
      .insert({
        sender_id: user.id,
        invitation_code: invitationCode,   // ← now you know it for sure
        email,
        expires_at: expiresAt.toISOString(),
        sender_email: user.email,
        status: 'pending',
      })
      .select('*')    // ← make sure invitation_code comes back
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('createPartnerInvitation caught:', error);
    return { data: null, error };
  }
}

// Get active invitation for current user
export async function getActiveInvitation(): Promise<{ data: PartnerInvitation | null, error: any }> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data, error } = await supabase
      .from('partner_invitations')
      .select('*')
      .eq('sender_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .maybeSingle();
      
    if (error) {
      console.error('Error getting active invitation:', error);
      throw error;
    }
    
    return { data: data || null, error: null };
  } catch (error) {
    console.error('Error getting active invitation:', error);
    return { data: null, error };
  }
}

// Get invitation by code
export async function getInvitationByCode(code: string): Promise<{ data: PartnerInvitation | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('partner_invitations')
      .select('*')
      .eq('invitation_code', code)
      .eq('status', 'pending')
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error getting invitation by code:', error);
    return { data: null, error };
  }
}

// Accept invitation and create relationship
export async function acceptInvitation(invitationId: string): Promise<{ success: boolean, error: any, relationshipId?: string }> {
  try {
    const { data: invitation, error: invitationError } = await supabase
      .from('partner_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();
      
    if (invitationError) throw invitationError;
    
    if (!invitation || invitation.status !== 'pending') {
      return { success: false, error: 'Invalid or expired invitation' };
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Prevent duplicate relationships
    const { data: existingRelationship, error: existingError } = await supabase
      .from('relationships')
      .select('id')
      .or(`and(user1_id.eq.${invitation.sender_id},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${invitation.sender_id})`)
      .eq('status', 'active')
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingRelationship) {
      return { success: false, error: 'You are already connected with this partner.' };
    }
    
    // Create relationship
    const { data: relationship, error: relationshipError } = await supabase
      .from('relationships')
      .insert({
        user1_id: invitation.sender_id,
        user2_id: user.id,
        status: 'active'
      })
      .select()
      .single();
      
    if (relationshipError) {
      // Handle unique constraint violation gracefully
      if (relationshipError.code === '23505') {
        return { success: false, error: 'You are already connected with this partner.' };
      }
      throw relationshipError;
    }
    
    // Update invitation status
    const { error: updateError } = await supabase
      .from('partner_invitations')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);
      
    if (updateError) throw updateError;
    
    return { 
      success: true, 
      error: null,
      relationshipId: relationship?.id 
    };
  } catch (error) {
    // Handle unique constraint violation gracefully
    if (error && typeof error === 'object' && error.code === '23505') {
      return { success: false, error: 'You are already connected with this partner.' };
    }
    console.error('Error accepting invitation:', error);
    if (error && typeof error === 'object') {
      for (const key in error) {
        if (Object.prototype.hasOwnProperty.call(error, key)) {
          console.log(`error[${key}]:`, error[key]);
        }
      }
    }
    return { success: false, error };
  }
}

// Decline invitation
export async function declineInvitation(invitationId: string): Promise<{ success: boolean, error: any }> {
  try {
    const { error } = await supabase
      .from('partner_invitations')
      .update({ 
        status: 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error declining invitation:', error);
    return { success: false, error };
  }
}

// Get relationships for current user
export async function getUserRelationships(): Promise<{ data: Relationship[], error: any }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    if (!user) {
      return { data: [], error: 'User not authenticated' };
    }
    
    // Get relationships where current user is either user1 or user2
    // Use public.users table instead of directly joining with auth.users
    const { data: relationships, error } = await supabase
      .from('relationships')
      .select(`
        id,
        user1_id,
        user2_id,
        status,
        created_at,
        updated_at
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active');
      
    if (error) {
      console.error('Error fetching relationships:', error);
      throw error;
    }
    
    // Format the relationships to include partner info
    const formattedRelationships = relationships.map(relationship => {
      const isUser1 = relationship.user1_id === user.id;
      const partnerId = isUser1 ? relationship.user2_id : relationship.user1_id;
      const partnerProfile = isUser1 ? relationship.user2 : relationship.user1;
      
      return {
        id: relationship.id,
        user1_id: relationship.user1_id,
        user2_id: relationship.user2_id,
        status: relationship.status,
        created_at: relationship.created_at,
        updated_at: relationship.updated_at,
        partner_name: partnerProfile?.name || 'Partner',
        partner_email: partnerProfile?.email || '',
        partner_id: partnerId
      };
    });
    
    return { data: formattedRelationships, error: null };
  } catch (error) {
    console.error('Error getting user relationships:', error);
    return { data: [], error };
  }
}

// Check if both users have completed their assessments
export async function checkBothPartnersCompletedAssessments(relationshipId: string): Promise<{ 
  completed: boolean, 
  user1Completed: boolean, 
  user2Completed: boolean,
  error: any 
}> {
  try {
    // Get relationship details
    const { data: relationship, error: relationshipError } = await supabase
      .from('relationships')
      .select('user1_id, user2_id')
      .eq('id', relationshipId)
      .single();
      
    if (relationshipError) throw relationshipError;
    
    if (!relationship) {
      return { 
        completed: false, 
        user1Completed: false, 
        user2Completed: false,
        error: 'Relationship not found' 
      };
    }
    
    // Check assessments for user1
    const { data: user1Assessments, error: error1 } = await supabase
      .from('assessment_history')
      .select('*')
      .eq('user_id', relationship.user1_id)
      .order('completed_at', { ascending: false });
      
    if (error1) throw error1;
    
    // Check assessments for user2
    const { data: user2Assessments, error: error2 } = await supabase
      .from('assessment_history')
      .select('*')
      .eq('user_id', relationship.user2_id)
      .order('completed_at', { ascending: false });
      
    if (error2) throw error2;
    
    const user1Completed = user1Assessments && user1Assessments.length > 0;
    const user2Completed = user2Assessments && user2Assessments.length > 0;
    
    return { 
      completed: user1Completed && user2Completed,
      user1Completed,
      user2Completed,
      error: null 
    };
  } catch (error) {
    console.error('Error checking assessments:', error);
    return { 
      completed: false, 
      user1Completed: false, 
      user2Completed: false,
      error 
    };
  }
}

// Calculate compatibility scores between two users
export async function calculateCompatibilityScores(
  relationshipId: string,
  user1Id: string,
  user2Id: string,
  autoTrigger: boolean = false
): Promise<{ data: CompatibilityScore | null, error: any }> {
  try {
    console.log('[calculateCompatibilityScores] Called for relationship:', relationshipId, 'user1:', user1Id, 'user2:', user2Id, 'autoTrigger:', autoTrigger);
    // Get user1 profile to determine gender
    const { data: user1Profile, error: profileError } = await supabase
      .from('profiles')
      .select('gender')
      .eq('id', user1Id)
      .single();
    console.log('[calculateCompatibilityScores] user1Profile:', user1Profile, 'error:', profileError);
    if (profileError) throw profileError;
    // Get user2 profile to determine gender
    const { data: user2Profile, error: profile2Error } = await supabase
      .from('profiles')
      .select('gender')
      .eq('id', user2Id)
      .single();
    console.log('[calculateCompatibilityScores] user2Profile:', user2Profile, 'error:', profile2Error);
    if (profile2Error) throw profile2Error;
    // Get latest assessment for user1
    const { data: user1Assessments, error: error1 } = await supabase
      .from('assessment_history')
      .select('*')
      .eq('user_id', user1Id)
      .order('completed_at', { ascending: false });
    console.log('[calculateCompatibilityScores] user1Assessments:', user1Assessments, 'error:', error1);
    if (error1) throw error1;
    // Get latest assessment for user2
    const { data: user2Assessments, error: error2 } = await supabase
      .from('assessment_history')
      .select('*')
      .eq('user_id', user2Id)
      .order('completed_at', { ascending: false });
    console.log('[calculateCompatibilityScores] user2Assessments:', user2Assessments, 'error:', error2);
    if (error2) throw error2;
    if (!user1Assessments?.length || !user2Assessments?.length) {
      console.warn('[calculateCompatibilityScores] One or both users have no assessments. user1Assessments:', user1Assessments, 'user2Assessments:', user2Assessments);
      return { 
        data: null, 
        error: 'Both partners must complete their assessments' 
      };
    }
    const user1Assessment = user1Assessments[0];
    const user2Assessment = user2Assessments[0];
    console.log('[calculateCompatibilityScores] Using user1Assessment:', user1Assessment);
    console.log('[calculateCompatibilityScores] Using user2Assessment:', user2Assessment);
    const categoryCompatibility: CategoryCompatibility[] = [];
    const user1Categories = user1Assessment.category_scores;
    const user2Categories = user2Assessment.category_scores;
    const allCategories = new Set<string>();
    user1Categories.forEach((cat: CategoryScore) => allCategories.add(cat.category));
    user2Categories.forEach((cat: CategoryScore) => allCategories.add(cat.category));
    allCategories.forEach(category => {
      const user1Category = user1Categories.find((c: CategoryScore) => c.category === category);
      const user2Category = user2Categories.find((c: CategoryScore) => c.category === category);
      if (user1Category && user2Category) {
        const user1Score = user1Category.percentage;
        const user2Score = user2Category.percentage;
        const difference = Math.abs(user1Score - user2Score);
        const compatibilityPercentage = Math.max(0, 100 - difference);
        
        // Calculate normalized scores (divide by 50 like PostgreSQL function)
        const normalizedUser1 = user1Score / 50;
        const normalizedUser2 = user2Score / 50;
        
        categoryCompatibility.push({
          category,
          user1_score: user1Score,
          user2_score: user2Score,
          normalized_user1: normalizedUser1,
          normalized_user2: normalizedUser2,
          match_percentage: compatibilityPercentage
        });
      }
    });
    console.log('[calculateCompatibilityScores] categoryCompatibility:', categoryCompatibility);
    const overallPercentage = categoryCompatibility.reduce(
      (sum, category) => sum + category.match_percentage, 
      0
    ) / categoryCompatibility.length;
    console.log('[calculateCompatibilityScores] overallPercentage:', overallPercentage);
    const { data: compatibilityScore, error } = await supabase
      .from('compatibility_scores')
      .insert({
        relationship_id: relationshipId,
        category_scores: categoryCompatibility,
        overall_score: overallPercentage,
        overall_percentage: overallPercentage,
        analysis_date: new Date().toISOString()
      })
      .select()
      .single();
    console.log('[calculateCompatibilityScores] Insert result:', compatibilityScore, 'error:', error);
    if (error) throw error;
    console.log('[calculateCompatibilityScores] Created compatibilityScore:', compatibilityScore);
    return { data: compatibilityScore, error: null };
  } catch (error) {
    console.error('[calculateCompatibilityScores] Error:', error);
    if (error && typeof error === 'object') {
      for (const key in error) {
        if (Object.prototype.hasOwnProperty.call(error, key)) {
          console.error(`[calculateCompatibilityScores] error[${key}]:`, error[key]);
        }
      }
    }
    return { data: null, error };
  }
}

// Get latest compatibility score for a relationship
export async function getLatestCompatibilityScore(relationshipId: string): Promise<{ data: CompatibilityScore | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('compatibility_scores')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('analysis_date', { ascending: false })
      .maybeSingle();
    
    if (error) throw error;
      
    // If no score exists, return null and a prompt message
    if (!data) {
      return { data: null, error: 'No compatibility score yet. Please complete assessments to generate a score.' };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error getting compatibility score:', error);
    return { data: null, error };
  }
}

// Get compatibility badge based on percentage
export function getCompatibilityBadge(percentage: number): string {
  if (percentage >= 90) return 'Perfect Match';
  if (percentage >= 80) return 'Highly Compatible';
  if (percentage >= 70) return 'Good Match';
  if (percentage >= 60) return 'Compatible';
  if (percentage >= 50) return 'Moderate Compatibility';
  if (percentage >= 40) return 'Some Challenges';
  if (percentage >= 30) return 'Significant Differences';
  return 'Major Incompatibilities';
}

// Get compatibility suggestion based on category
export function getCompatibilitySuggestion(category: string, score: number): string {
  const suggestions: Record<string, {high: string, medium: string, low: string}> = {
    'Mental Traits': {
      high: 'You both have similar thought processes and intellectual approaches.',
      medium: 'Your thinking styles differ somewhat. Focus on understanding each other\'s perspectives.',
      low: 'Your mental approaches differ significantly. Consider working on communication techniques.'
    },
    'Emotional Traits': {
      high: 'You\'re emotionally in sync and likely understand each other\'s feelings well.',
      medium: 'You have some emotional differences. Practice active listening and validation.',
      low: 'Your emotional styles differ greatly. Consider learning about emotional intelligence together.'
    },
    'Physical Traits': {
      high: 'You have similar physical priorities and expectations.',
      medium: 'Your physical preferences have some differences. Open communication is important.',
      low: 'Your physical expectations differ significantly. Have honest conversations about needs.'
    },
    'Financial Traits': {
      high: 'You share similar financial values and approaches to money.',
      medium: 'Your financial styles have some differences. Consider creating shared financial goals.',
      low: 'Your approaches to finances differ greatly. Consider financial counseling.'
    },
    'Family & Cultural Compatibility': {
      high: 'You share similar family values and cultural expectations.',
      medium: 'Your family and cultural backgrounds have some differences. Respect and learn from each other.',
      low: 'Your family and cultural approaches differ significantly. Work on building bridges between traditions.'
    },
    'Conflict Resolution Style': {
      high: 'You resolve conflicts in similar ways, which minimizes friction.',
      medium: 'Your conflict styles have some differences. Learn each other\'s needs during disagreements.',
      low: 'Your approaches to conflict differ greatly. Consider learning conflict resolution techniques.'
    }
  };

  const category_suggestions = suggestions[category] || {
    high: 'You are highly compatible in this area.',
    medium: 'You have moderate compatibility in this area.',
    low: 'You have significant differences in this area.'
  };

  if (score >= 75) return category_suggestions.high;
  if (score >= 50) return category_suggestions.medium;
  return category_suggestions.low;
}

// Fetch all compatibility scores for a user
export async function fetchAllCompatibilityScores(userId: string): Promise<{ data: CompatibilityScore[], error: any }> {
  try {
    const { data, error } = await supabase
      .from('compatibility_scores')
      .select('*')
      .eq('relationship_id', userId);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all compatibility scores:', error);
    return { data: [], error };
  }
}

// Summarize compatibility scores for a user
export async function summarizeCompatibilityScores(userId: string): Promise<{ data: CompatibilityScoreSummary, error: any }> {
  try {
    const { data: scores, error: scoresError } = await fetchAllCompatibilityScores(userId);
    if (scoresError) throw scoresError;
    
    const summary: CompatibilityScoreSummary = {
      overall_score: 0,
      overall_percentage: 0,
      category_scores: {},
      analysis_date: '',
      created_at: ''
    };
    
    scores.forEach(score => {
      summary.overall_score += score.overall_score;
      summary.overall_percentage += score.overall_percentage;
      score.category_scores.forEach(category => {
        if (!summary.category_scores[category.category]) {
          summary.category_scores[category.category] = {
            category: category.category,
            user1_score: 0,
            user2_score: 0,
            normalized_user1: 0,
            normalized_user2: 0,
            match_percentage: 0
          };
        }
        summary.category_scores[category.category].user1_score += category.user1_score;
        summary.category_scores[category.category].user2_score += category.user2_score;
        summary.category_scores[category.category].normalized_user1 += category.normalized_user1;
        summary.category_scores[category.category].normalized_user2 += category.normalized_user2;
        summary.category_scores[category.category].match_percentage += category.match_percentage;
      });
      summary.analysis_date = score.analysis_date;
      summary.created_at = score.created_at;
    });
    
    summary.overall_score /= scores.length;
    summary.overall_percentage /= scores.length;
    
    return { data: summary, error: null };
  } catch (error) {
    console.error('Error summarizing compatibility scores:', error);
    return { data: null, error };
  }
}

// Invite a partner
export async function invitePartner(email: string | null): Promise<{ data: PartnerInvitation | null, error: any }> {
  try {
    const { data, error } = await createPartnerInvitation(email);
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error inviting partner:', error);
    return { data: null, error };
  }
}

// Accept a partner
export async function acceptPartner(invitationId: string): Promise<{ success: boolean, error: any, relationshipId?: string }> {
  try {
    const { data, error } = await acceptInvitation(invitationId);
    if (error) throw error;
    
    return { success: true, error: null, relationshipId: data?.relationshipId };
  } catch (error) {
    console.error('Error accepting partner:', error);
    return { success: false, error };
  }
}