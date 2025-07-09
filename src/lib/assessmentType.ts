import type { Profile } from '@/types/profile';

export type AssessmentType = 'high-value-man' | 'wife-material' | 'bridal-price';

export function getAssessmentType(profile: Profile | null, urlType?: string | null): AssessmentType | null {
  if (!profile) {
    return null;
  }

  // If a specific type is requested via URL, validate it against the user's gender
  if (urlType) {
    switch (urlType) {
      case 'high-value-man':
        return profile.gender === 'male' ? 'high-value-man' : null;
      case 'wife-material':
      case 'bridal-price':
        return profile.gender === 'female' ? urlType : null;
      default:
        return null;
    }
  }

  // Default assessment type based on gender if no specific type is requested
  if (profile.gender === 'male') {
    return 'high-value-man';
  }
  
  // For female users, default to wife-material unless they're from Africa
  if (profile.gender === 'female') {
    return profile.region === 'africa' && profile.cultural_context === 'african' 
      ? 'bridal-price' 
      : 'wife-material';
  }

  return null;
}