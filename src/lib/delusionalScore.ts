import { supabase } from '@/lib/supabase';
import { getExternalAssessmentResults, type ExternalAssessmentResult } from '@/lib/externalAssessments';
import { getAssessmentHistory } from '@/lib/supabase';
import type { AssessmentType } from '@/lib/assessmentType';
import type { CategoryScore } from '@/lib/scores';

export interface CategoryGap {
  category: string;
  self_score: number;
  external_score: number;
  gap: number;
  status: 'self-aware' | 'blind-spot' | 'delusional';
}

export interface DelusionalScoreResult {
  overall_score: number;
  status: 'self-aware' | 'blind-spot' | 'delusional';
  category_gaps: CategoryGap[];
  external_assessment_count: number;
}

/**
 * Calculate the delusional score for a user
 * This compares self-assessment scores with external assessment scores
 */
export async function calculateDelusionalScore(
  userId: string,
  assessmentType: AssessmentType
): Promise<DelusionalScoreResult | null> {
  try {
    // Get user's self-assessment
    const { data: selfAssessments, error: selfError } = await getAssessmentHistory(userId);
    if (selfError) throw selfError;
    
    // Filter for the specified assessment type and get the latest one
    const selfAssessment = selfAssessments
      .filter(a => a.assessment_type === assessmentType)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
      
    if (!selfAssessment) {
      console.error('No self-assessment found for this user and assessment type');
      return null;
    }

    // Get external assessments for the user
    const { data: externalResults, error: externalError } = await getExternalAssessmentResults(
      userId,
      assessmentType
    );
    
    if (externalError) throw externalError;
    
    if (!externalResults || externalResults.length === 0) {
      console.error('No external assessments found for this user');
      return null;
    }
    
    // Calculate category gaps
    const selfScores = selfAssessment.category_scores as CategoryScore[];
    const categoryGaps: CategoryGap[] = [];
    
    // For each category in the self assessment
    selfScores.forEach(selfCategory => {
      // Calculate the average external score for this category
      let totalExternalScore = 0;
      let externalCount = 0;
      
      externalResults.forEach(externalResult => {
        const externalCategory = externalResult.category_scores.find(
          (c: CategoryScore) => c.category === selfCategory.category
        );
        
        if (externalCategory) {
          totalExternalScore += externalCategory.percentage;
          externalCount++;
        }
      });
      
      if (externalCount > 0) {
        const averageExternalScore = totalExternalScore / externalCount;
        const gap = Math.abs(selfCategory.percentage - averageExternalScore);
        
        // Determine status based on gap size
        let status: 'self-aware' | 'blind-spot' | 'delusional';
        if (gap <= 10) {
          status = 'self-aware';
        } else if (gap <= 25) {
          status = 'blind-spot';
        } else {
          status = 'delusional';
        }
        
        categoryGaps.push({
          category: selfCategory.category,
          self_score: selfCategory.percentage,
          external_score: averageExternalScore,
          gap,
          status
        });
      }
    });
    
    // Calculate overall delusional score (average gap)
    const totalGap = categoryGaps.reduce((sum, category) => sum + category.gap, 0);
    const overallScore = categoryGaps.length > 0 ? totalGap / categoryGaps.length : 0;
    
    // Determine overall status based on overall score
    let overallStatus: 'self-aware' | 'blind-spot' | 'delusional';
    if (overallScore <= 10) {
      overallStatus = 'self-aware';
    } else if (overallScore <= 25) {
      overallStatus = 'blind-spot';
    } else {
      overallStatus = 'delusional';
    }
    
    // Save calculated results to database
    await updateDelusionalScores(externalResults, categoryGaps, overallScore);
    
    return {
      overall_score: overallScore,
      status: overallStatus,
      category_gaps: categoryGaps,
      external_assessment_count: externalResults.length
    };
  } catch (error) {
    console.error('Error calculating delusional score:', error);
    return null;
  }
}

/**
 * Update external assessment results with delusional scores
 */
async function updateDelusionalScores(
  externalResults: ExternalAssessmentResult[],
  categoryGaps: CategoryGap[],
  overallScore: number
): Promise<void> {
  try {
    // Update each external assessment result with its contribution to the delusional score
    for (const result of externalResults) {
      await supabase
        .from('external_assessment_results')
        .update({
          category_gap: categoryGaps,
          delusional_score: overallScore
        })
        .eq('id', result.id);
    }
  } catch (error) {
    console.error('Error updating delusional scores:', error);
  }
}

/**
 * Get feedback message based on delusional score and category
 */
export function getDelusionalFeedback(
  category: string, 
  gap: number, 
  selfScore: number, 
  externalScore: number
): string {
  // Is self-score higher or lower than external score?
  const perception = selfScore > externalScore ? 'higher than' : 'lower than';
  
  const feedbackMap: Record<string, { low: string, medium: string, high: string }> = {
    'Mental Traits': {
      low: `You have a clear understanding of your mental traits.`,
      medium: `You rate yourself ${perception} others see your mental flexibility and accountability.`,
      high: `There's a significant gap between how you view your mental traits and how others perceive them. Consider seeking specific feedback in this area.`
    },
    'Emotional Traits': {
      low: `Your emotional self-awareness matches how others see you.`,
      medium: `You assess your emotional intelligence ${perception} others experience it. Consider reflecting on your emotional expressions.`,
      high: `There's a major disconnect between your perception of your emotional traits and how others experience them. This is an important area for growth.`
    },
    'Physical Traits': {
      low: `Your physical self-perception aligns with external perceptions.`,
      medium: `You view your physical presentation ${perception} others observe it. Consider how your appearance and presence comes across to others.`,
      high: `There's a significant mismatch between how you see your physical traits and how others perceive them. This could be affecting your relationships.`
    },
    'Financial Traits': {
      low: `Your financial self-assessment matches external perception.`,
      medium: `You rate your financial habits ${perception} others perceive them. Consider if you're being realistic about your financial discipline.`,
      high: `There's a major disconnect between how you view your financial traits and how others see them. This area might need serious recalibration.`
    },
    'Family & Cultural Compatibility': {
      low: `Your assessment of your cultural adaptability matches others' perceptions.`,
      medium: `You rate your family and cultural compatibility ${perception} others see it. Consider how your actions may be interpreted differently.`,
      high: `There's a significant gap between how you view your cultural adaptability and how others experience it. This could be causing relationship friction.`
    },
    'Conflict Resolution Style': {
      low: `Your conflict resolution self-assessment aligns with how others see you.`,
      medium: `You perceive your conflict resolution abilities ${perception} others experience them. Reflect on how you handle disagreements.`,
      high: `There's a major disconnect between how you view your conflict resolution style and how others experience it. This is a critical area for improvement.`
    }
  };

  const categoryFeedback = feedbackMap[category] || {
    low: `Your self-perception in this area matches how others see you.`,
    medium: `There's a moderate gap between your self-perception and others' perception in this area.`,
    high: `There's a significant gap between how you see yourself and how others perceive you in this area.`
  };

  if (gap <= 10) return categoryFeedback.low;
  if (gap <= 25) return categoryFeedback.medium;
  return categoryFeedback.high;
}

/**
 * Get overall feedback based on delusional score
 */
export function getOverallDelusionalFeedback(score: number): string {
  if (score <= 10) {
    return "You have exceptional self-awareness! Your perception of yourself closely aligns with how others see you, which is a strong foundation for personal growth and authentic relationships.";
  } else if (score <= 25) {
    return "You have some blind spots in how you see yourself compared to how others perceive you. This is normal, and being aware of these gaps is the first step toward greater self-awareness.";
  } else {
    return "There are significant differences between your self-perception and how others see you. This disconnect could be affecting your relationships and personal growth. Consider open conversations with trusted friends for honest feedback.";
  }
}