import { createClient } from '@supabase/supabase-js';
import type { Profile } from '@/types/profile';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) throw error;
    
    return { 
      data: data ? {
        ...data,
        dob: data.dob || null
      } : null, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { data: null, error };
  }
}

export async function updateProfile(userId: string, profile: Partial<Profile>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
}

export async function saveAssessmentResults(
  userId: string,
  assessmentType: string,
  categoryScores: { category: string; score: number; percentage: number; weight: number }[],
  overallScore: number,
  overallPercentage: number
) {
  try {
    const { data, error } = await supabase
      .from('assessment_history')
      .insert([
        {
          user_id: userId,
          assessment_type: assessmentType,
          category_scores: categoryScores,
          overall_score: overallScore,
          overall_percentage: overallPercentage,
          completed_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving assessment results:', error);
    return { data: null, error };
  }
}

export async function getAssessmentById(assessmentId: string) {
  const { data, error } = await supabase
    .from('assessment_history')
    .select('*')
    .eq('id', assessmentId)
    .single();
    
  return { data, error };
}

export async function getAssessmentHistory(userId: string) {
  const { data, error } = await supabase
    .from('assessment_history')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
    
  return { data, error };
}