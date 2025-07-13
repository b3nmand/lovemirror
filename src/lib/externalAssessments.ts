import type { AssessmentType } from '@/lib/assessmentType';
import { calculateDelusionalScore } from '@/lib/delusionalScore';
import { calculateScores, type CategoryScore } from '@/lib/scores';
import { supabase } from '@/lib/supabase';

export interface ExternalAssessmentResult {
  id: string;
  assessor_id: string;
  user_id: string;
  assessment_type: AssessmentType;
  category_scores: CategoryScore[];
  overall_score: number;
  overall_percentage: number;
  feedback: string | null;
  completed_at: string;
  created_at: string;
  category_gap?: any;
  delusional_score?: number;
}

export type ExternalAssessmentSummary = {
  assessment_type: AssessmentType;
  count: number;
  average_score: number;
  average_percentage: number;
  category_averages: {
    category: string;
    average_score: number;
    average_percentage: number;
  }[];
};

// Submit an external assessment
export async function submitExternalAssessment(
  assessorId: string,
  userId: string,
  assessmentType: AssessmentType,
  responses: { questionId: string; category: string; score: number }[],
  feedback?: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Calculate scores
    const result = calculateScores(responses, assessmentType);
    
    // Save to database
    const { data, error } = await supabase
      .from('external_assessment_results')
      .insert({
        assessor_id: assessorId,
        user_id: userId,
        assessment_type: assessmentType,
        category_scores: result.categoryScores,
        overall_score: result.overallScore,
        overall_percentage: result.overallPercentage,
        feedback: feedback || null,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Calculate delusional score in the background
    calculateDelusionalScore(userId, assessmentType)
      .then(delusionalResult => {
        console.log('[ExternalAssessment] Delusional score calculated:', delusionalResult, 'user:', userId, 'assessor:', assessorId, 'type:', assessmentType);
        
        // Publish event to notify UI of the updated delusional score
        const event = new CustomEvent('delusional-score-updated', { 
          detail: { userId, assessmentType, delusionalResult } 
        });
        window.dispatchEvent(event);
      })
      .catch(err => {
        console.error('[ExternalAssessment] Error calculating delusional score:', err, 'user:', userId, 'assessor:', assessorId, 'type:', assessmentType);
      });

    return { success: true, error: null };
  } catch (error) {
    console.error('[ExternalAssessment] Error submitting external assessment:', error, 'user:', userId, 'assessor:', assessorId, 'type:', assessmentType);
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

// Get external assessment results for a user
export async function getExternalAssessmentResults(
  userId: string,
  assessmentType?: AssessmentType
): Promise<{ data: ExternalAssessmentResult[]; error: any }> {
  try {
    let query = supabase
      .from('external_assessment_results')
      .select('*')
      .eq('user_id', userId);
    
    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType);
    }
    
    const { data, error } = await query.order('completed_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting external assessment results:', error);
    return { data: [], error };
  }
}

// Get a single external assessment result by ID
export async function getExternalAssessmentById(
  id: string
): Promise<{ data: ExternalAssessmentResult | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('external_assessment_results')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error getting external assessment by ID:', error);
    return { data: null, error };
  }
}

// Get assessor information for an assessment result
export async function getAssessorForAssessment(
  assessorId: string
): Promise<{ relationship: string; email: string | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('external_assessors')
      .select('relationship, email')
      .eq('id', assessorId)
      .single();

    if (error) throw error;

    return { 
      relationship: data?.relationship || 'Unknown',
      email: data?.email || null,
      error: null 
    };
  } catch (error) {
    console.error('Error getting assessor information:', error);
    return { relationship: 'Unknown', email: null, error };
  }
}

// Calculate summary of external assessment results
export function calculateExternalAssessmentSummary(
  results: ExternalAssessmentResult[]
): ExternalAssessmentSummary | null {
  if (!results || results.length === 0) return null;
  
  const assessmentType = results[0].assessment_type;
  const count = results.length;
  
  // Calculate average overall score
  const totalScore = results.reduce((sum, result) => sum + result.overall_score, 0);
  const totalPercentage = results.reduce((sum, result) => sum + result.overall_percentage, 0);
  
  const averageScore = totalScore / count;
  const averagePercentage = totalPercentage / count;
  
  // Calculate category averages
  const categoryScores: Record<string, { totalScore: number; totalPercentage: number; count: number }> = {};
  
  results.forEach(result => {
    result.category_scores.forEach((category: CategoryScore) => {
      if (!categoryScores[category.category]) {
        categoryScores[category.category] = { totalScore: 0, totalPercentage: 0, count: 0 };
      }
      
      categoryScores[category.category].totalScore += category.score;
      categoryScores[category.category].totalPercentage += category.percentage;
      categoryScores[category.category].count += 1;
    });
  });
  
  const categoryAverages = Object.entries(categoryScores).map(([category, data]) => ({
    category,
    average_score: data.totalScore / data.count,
    average_percentage: data.totalPercentage / data.count
  }));
  
  return {
    assessment_type: assessmentType,
    count,
    average_score: averageScore,
    average_percentage: averagePercentage,
    category_averages: categoryAverages
  };
}