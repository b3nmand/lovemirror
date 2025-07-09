import { Category } from '@/lib/questions';

// Category weights for each assessment type
const CATEGORY_WEIGHTS = {
  'high-value-man': {
    'Mental Traits': 1.3,
    'Emotional Traits': 1.0,
    'Physical Traits': 0.8,
    'Financial Traits': 1.5,
    'Family & Cultural Compatibility': 1.0,
    'Conflict Resolution Style': 1.2
  },
  'bridal-price': {
    'Mental Traits': 1.0,
    'Emotional Traits': 1.2,
    'Physical Traits': 1.0,
    'Financial Traits': 0.9,
    'Family & Cultural Compatibility': 1.5,
    'Conflict Resolution Style': 1.2
  },
  'wife-material': {
    'Mental Traits': 1.0,
    'Emotional Traits': 1.2,
    'Physical Traits': 1.5,
    'Financial Traits': 0.8,
    'Family & Cultural Compatibility': 1.3,
    'Conflict Resolution Style': 1.2
  }
};

// Rating badges based on overall percentage
const RATING_BADGES = {
  'high-value-man': [
    { min: 90, badge: 'Elite Provider' },
    { min: 80, badge: 'High-Value Leader' },
    { min: 70, badge: 'Balanced Provider' },
    { min: 60, badge: 'Developing Provider' },
    { min: 0, badge: 'Needs Improvement' }
  ],
  'bridal-price': [
    { min: 90, badge: 'Premium Bride' },
    { min: 80, badge: 'High-Value Partner' },
    { min: 70, badge: 'Traditional Value' },
    { min: 60, badge: 'Growing Potential' },
    { min: 0, badge: 'Needs Development' }
  ],
  'wife-material': [
    { min: 90, badge: 'Exceptional Partner' },
    { min: 80, badge: 'Strong Life Partner' },
    { min: 70, badge: 'Balanced Partner' },
    { min: 60, badge: 'Growing Partner' },
    { min: 0, badge: 'Needs Growth' }
  ]
};

// Region multipliers for bridal price
export const REGION_MULTIPLIERS = {
  'africa': 1.2,
  'west_africa': 1.3,
  'east_africa': 1.1,
  'north_africa': 1.0,
  'southern_africa': 1.15,
  'asia': 0.9,
  'europe': 0.8,
  'north_america': 0.85,
  'south_america': 0.75,
  'oceania': 0.7,
  'global': 1.0
};

interface Response {
  questionId: string;
  category: string;
  score: number;
  weight?: number;
}

export interface CategoryScore {
  category: string;
  score: number;
  percentage: number;
  weight: number;
}

export interface AssessmentResult {
  categoryScores: CategoryScore[];
  overallScore: number;
  overallPercentage: number;
  lowestCategories: CategoryScore[];
  assessmentType: string;
  badge: string;
}

export interface BridalPriceResult {
  totalPrice: number;
  formattedPrice: string;
  categoryValues: {
    category: string;
    value: number;
    percentage: number;
    formattedValue: string;
  }[];
  currencySymbol: string;
  regionMultiplier: number;
  region: string;
  baseValue: number;
}

export function calculateScores(responses: Response[], assessmentType: string): AssessmentResult {
  const categoryWeights = CATEGORY_WEIGHTS[assessmentType as keyof typeof CATEGORY_WEIGHTS] || {};

  // Group responses by category
  const categorizedResponses = responses.reduce((acc, response) => {
    if (!acc[response.category]) {
      acc[response.category] = [];
    }
    acc[response.category].push(response);
    return acc;
  }, {} as Record<string, Response[]>);
  
  // Calculate score for each category
  const categoryScores = Object.entries(categorizedResponses).map(([category, responses]) => {
    const totalScore = responses.reduce((sum, response) => sum + (response.score * (response.weight || 1)), 0);
    const maxPossibleScore = responses.length * 5; // Using 1-5 scale
    const percentage = (totalScore / maxPossibleScore) * 100;
    
    // Apply category weight
    const weight = categoryWeights[category] || 1.0;
    const weightedScore = totalScore * weight;
    
    return {
      category,
      score: totalScore,
      percentage,
      weight
    };
  });
  
  // Calculate overall score
  const totalWeightedScore = categoryScores.reduce((sum, category) => sum + (category.score * category.weight), 0);
  const totalMaxWeightedScore = Object.entries(categorizedResponses).reduce(
    (sum, [category, responses]) => {
      const weight = categoryWeights[category] || 1.0;
      return sum + (responses.length * 5 * weight);
    }, 0
  );
  
  const overallPercentage = (totalWeightedScore / totalMaxWeightedScore) * 100;
  
  // Get rating badge
  const ratings = RATING_BADGES[assessmentType as keyof typeof RATING_BADGES] || [];
  const badge = ratings.find(r => overallPercentage >= r.min)?.badge || 'Unrated';
  
  // Find lowest scoring categories
  const sortedCategories = [...categoryScores].sort((a, b) => a.percentage - b.percentage);
  const lowestCategories = sortedCategories.slice(0, 2);
  
  return {
    categoryScores,
    overallScore: totalWeightedScore,
    overallPercentage,
    lowestCategories,
    assessmentType,
    badge
  };
}

export function calculateBridalPrice(
  categoryScores: CategoryScore[], 
  baseValue: number = 10000,
  region: string = 'global',
  partnerIncome?: number,
  bridalPricePercentage?: number
): BridalPriceResult {
  // Get region multiplier
  const regionMultiplier = REGION_MULTIPLIERS[region as keyof typeof REGION_MULTIPLIERS] || 1.0;
  
  // Calculate the value contribution of each category
  const totalWeight = categoryScores.reduce((sum, category) => sum + category.weight, 0);
  
  const categoryValues = categoryScores.map(category => {
    // Calculate normalized category contribution percentage (0-1)
    const categoryNormalized = (category.percentage / 100);
    
    // Calculate category's share of the base value
    const categoryShare = (category.weight / totalWeight);
    const categoryBaseValue = baseValue * categoryShare;
    
    // Calculate final value for this category
    const value = categoryBaseValue * categoryNormalized * regionMultiplier;
    
    return {
      category: category.category,
      value,
      percentage: category.percentage,
      formattedValue: formatCurrency(value)
    };
  });
  
  // Calculate total bridal price
  let totalPrice = categoryValues.reduce((sum, cat) => sum + cat.value, 0);
  
  // If using salary-based calculation
  if (partnerIncome && bridalPricePercentage) {
    // Convert percentage to decimal (e.g., 20% -> 0.2)
    const percentageDecimal = bridalPricePercentage / 100;
    
    // Calculate overall score as percentage (0-1)
    const overallScore = categoryScores.reduce((sum, cat) => sum + (cat.percentage * cat.weight), 0) / 
                         categoryScores.reduce((sum, cat) => sum + (100 * cat.weight), 0);
    
    // Calculate salary-based bridal price
    totalPrice = partnerIncome * percentageDecimal * overallScore;
  }
  
  return {
    totalPrice,
    formattedPrice: formatCurrency(totalPrice),
    categoryValues,
    currencySymbol: '$',
    regionMultiplier,
    region,
    baseValue
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function generateSuggestions(lowestCategories: CategoryScore[]): { 
  title: string; 
  action: string; 
  timeline: string;
}[] {
  const suggestions = {
    'Mental Traits': [
      {
        title: 'Improve self-reflection',
        action: 'Journal daily about your thoughts and reactions',
        timeline: '30 days'
      },
      {
        title: 'Enhance listening skills',
        action: 'Practice active listening without interrupting',
        timeline: '21 days'
      }
    ],
    'Emotional Traits': [
      {
        title: 'Build emotional awareness',
        action: 'Name your emotions when they arise',
        timeline: '14 days'
      },
      {
        title: 'Express appreciation daily',
        action: 'Share one thing you appreciate about your partner each day',
        timeline: '30 days'
      }
    ],
    'Physical Traits': [
      {
        title: 'Establish a fitness routine',
        action: 'Exercise for 30 minutes 3 times per week',
        timeline: '60 days'
      },
      {
        title: 'Enhance personal grooming',
        action: 'Update your grooming routine',
        timeline: '14 days'
      }
    ],
    'Financial Traits': [
      {
        title: 'Create a budget',
        action: 'Track all expenses for a month',
        timeline: '30 days'
      },
      {
        title: 'Build financial transparency',
        action: 'Have weekly money discussions with your partner',
        timeline: '60 days'
      }
    ],
    'Family & Cultural Compatibility': [
      {
        title: 'Understand partner family values',
        action: 'Have a conversation about family traditions',
        timeline: '30 days'
      },
      {
        title: 'Set healthy boundaries',
        action: 'Establish clear family boundaries with your partner',
        timeline: '60 days'
      }
    ],
    'Conflict Resolution Style': [
      {
        title: 'Practice de-escalation',
        action: 'Use "I" statements during disagreements',
        timeline: '30 days'
      },
      {
        title: 'Learn conflict resolution skills',
        action: 'Read a book on healthy conflict resolution',
        timeline: '45 days'
      }
    ]
  };
  
  return lowestCategories.flatMap(category => {
    const categorySuggestions = suggestions[category.category as keyof typeof suggestions] || [];
    return categorySuggestions;
  });
}

// Helper function to get badge for score - used by results pages
export function getBadgeForScore(score: number, assessmentType: string): string {
  const ratings = RATING_BADGES[assessmentType as keyof typeof RATING_BADGES] || [];
  return ratings.find(r => score >= r.min)?.badge || 'Unrated';
}