import { z } from 'zod';

export interface ExternalQuestion {
  id: string;
  category: string;
  text: string;
  weight?: number;
  importance?: number;
}

export interface Category {
  name: string;
  color: string;
  description: string;
  gradient: string;
}

export type AssessmentType = 'high-value-man' | 'wife-material' | 'bridal-price';

export const CATEGORIES: Record<string, Category> = {
  'Mental Traits': {
    name: 'Mental Traits',
    color: 'bg-blue-500',
    description: 'How they think and process information',
    gradient: 'from-blue-500 to-blue-600'
  },
  'Emotional Traits': {
    name: 'Emotional Traits',
    color: 'bg-purple-500',
    description: 'How they manage and express feelings',
    gradient: 'from-purple-500 to-purple-600'
  },
  'Physical Traits': {
    name: 'Physical Traits',
    color: 'bg-emerald-500',
    description: 'How they maintain their appearance and health',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  'Financial Traits': {
    name: 'Financial Traits',
    color: 'bg-yellow-500',
    description: 'How they handle money and resources',
    gradient: 'from-yellow-500 to-yellow-600'
  },
  'Family & Cultural Compatibility': {
    name: 'Family & Cultural Compatibility',
    color: 'bg-red-800',
    description: 'How they navigate family dynamics',
    gradient: 'from-red-800 to-red-900'
  },
  'Conflict Resolution Style': {
    name: 'Conflict Resolution Style',
    color: 'bg-rose-500',
    description: 'How they handle disagreements',
    gradient: 'from-rose-500 to-rose-600'
  }
};

// Parse CSV data into questions
function parseCSV(csvData: string): ExternalQuestion[] {
  return csvData.split('\n')
    .slice(1) // Skip header row
    .filter(line => line.trim())
    .map((line, index) => {
      const [category, text] = line.split(',').map(s => s.trim());
      return {
        id: `q${index + 1}`,
        category,
        text,
        weight: 1,
        importance: 1
      };
    });
}

// Male assessment questions for external assessors
const MALE_EXTERNAL_QUESTIONS = parseCSV(`Category,Question
Mental Traits,[User's Name] takes accountability when they're wrong instead of deflecting blame.
Mental Traits,[User's Name] responds calmly when challenged by their partner.
Mental Traits,[User's Name] shows openness to personal growth and avoids holding onto outdated mindsets.
Mental Traits,[User's Name] listens to understand, not just to reply.
Mental Traits,[User's Name] manages their emotions constructively when triggered.
Mental Traits,[User's Name] reflects on how their behavior impacts their partner.
Mental Traits,[User's Name] is comfortable being vulnerable and treats it as a strength.
Mental Traits,[User's Name] works to correct bad habits rather than expecting tolerance.
Mental Traits,[User's Name] handles constructive criticism without becoming defensive.
Mental Traits,[User's Name] does not confuse being 'alpha' with emotional unavailability.
Emotional Traits,[User's Name] makes space for their partner's emotions without trying to fix them.
Emotional Traits,[User's Name] regularly expresses appreciation, affection, and care in non-sexual ways.
Emotional Traits,[User's Name] is emotionally consistent in demonstrating care.
Emotional Traits,[User's Name] validates their partner's feelings rather than dismissing them.
Emotional Traits,[User's Name] openly shares emotions instead of bottling them up.
Emotional Traits,[User's Name] makes their partner feel emotionally safe.
Emotional Traits,[User's Name] stays calm and engaged when their partner is upset.
Emotional Traits,[User's Name] values emotional intimacy as much as physical intimacy.
Emotional Traits,[User's Name] offers reassurance without acting controlled or resentful.
Emotional Traits,[User's Name] makes their partner feel seen, heard, and emotionally secure.
Physical Traits,[User's Name] maintains daily hygiene and grooming.
Physical Traits,[User's Name] remains mindful of health and appearance since the relationship began.
Physical Traits,[User's Name] dresses in a way that reflects pride in their appearance.
Physical Traits,[User's Name] consistently puts in effort to be physically appealing to their partner.
Physical Traits,[User's Name] is attentive to their partner's sexual needs as well as their own.
Physical Traits,[User's Name] initiates physical affection outside of sexual contexts.
Physical Traits,[User's Name] works consistently on fitness, energy, and personal presentation.
Physical Traits,[User's Name] listens to their partner's feedback about attraction and appearance.
Physical Traits,[User's Name] makes effort in planning date nights and special occasions.
Physical Traits,[User's Name] is perceived by their partner as physically present, attractive, and invested.
Financial Traits,[User's Name] has a clear financial plan and practices saving.
Financial Traits,[User's Name] is honest about their finances and avoids hiding spending or debt.
Financial Traits,[User's Name] discusses financial burdens openly with their partner.
Financial Traits,[User's Name] focuses on building a long-term future together.
Financial Traits,[User's Name] invests in personal growth rather than spending to impress others.
Financial Traits,[User's Name] fulfills provider roles comfortably and without resentment.
Financial Traits,[User's Name] supports their partner's financial success without feeling threatened.
Financial Traits,[User's Name] manages money with discipline, not impulsivity.
Financial Traits,[User's Name] is generous in healthy ways without using it for manipulation.
Financial Traits,[User's Name]'s partner feels financially secure with them.
Family & Cultural Compatibility,[User's Name] respects their partner's culture and avoids imposing their own.
Family & Cultural Compatibility,[User's Name] protects their partner from disrespect by family members.
Family & Cultural Compatibility,[User's Name] shields their relationship from family drama and undue pressure.
Family & Cultural Compatibility,[User's Name] makes their partner feel like an equal partner, not just an addition to their family.
Family & Cultural Compatibility,[User's Name] values their partner's family involvement as much as their own.
Family & Cultural Compatibility,[User's Name] builds healthy boundaries between family and relationship dynamics.
Family & Cultural Compatibility,[User's Name] does not expect submission without providing security and respect.
Family & Cultural Compatibility,[User's Name] openly discusses cultural clashes rather than dictating outcomes.
Family & Cultural Compatibility,[User's Name] avoids using tradition or religion as tools for control.
Family & Cultural Compatibility,[User's Name] integrates family values with emotional intelligence in the relationship.
Conflict Resolution Style,[User's Name] communicates openly instead of shutting down when angry.
Conflict Resolution Style,[User's Name] avoids raising their voice, using sarcasm, or making threats during conflicts.
Conflict Resolution Style,[User's Name] works to de-escalate conflicts rather than dominate them.
Conflict Resolution Style,[User's Name] stays engaged in disagreements until they are resolved.
Conflict Resolution Style,[User's Name] takes accountability after conflicts instead of simply moving on.
Conflict Resolution Style,[User's Name] does not use silence or withdrawal to avoid emotional repair.
Conflict Resolution Style,[User's Name] listens to their partner's pain without deflecting blame.
Conflict Resolution Style,[User's Name] avoids holding grudges or rehashing past arguments unnecessarily.
Conflict Resolution Style,[User's Name] seeks clarity during arguments instead of rushing to end them.
Conflict Resolution Style,[User's Name]'s partner feels safe, heard, and respected even during disagreements.`);

// Female assessment questions for external assessors
const FEMALE_EXTERNAL_QUESTIONS = parseCSV(`Category,Question
Mental Traits,[User's Name] remains calm and avoids escalating small disagreements into larger emotional reactions.
Mental Traits,[User's Name] communicates clearly when hurt, instead of expecting their partner to guess.
Mental Traits,[User's Name] does not use emotional withdrawal or silence as punishment.
Mental Traits,[User's Name] takes responsibility for their role in relationship problems.
Mental Traits,[User's Name] avoids impulsively saying hurtful things.
Mental Traits,[User's Name] stays calm and rational even when emotionally triggered.
Mental Traits,[User's Name] does not use emotions to control the outcome of conflicts.
Mental Traits,[User's Name] self-reflects when receiving feedback from their partner, rather than becoming defensive.
Mental Traits,[User's Name] manages their mood independently instead of relying on their partner to fix it.
Mental Traits,[User's Name] is willing to unlearn negative patterns from past relationships.
Emotional Traits,[User's Name] regularly shows appreciation, not just when things go wrong.
Emotional Traits,[User's Name] focuses on making their partner feel loved, not just on feeling loved themselves.
Emotional Traits,[User's Name] acknowledges and respects their partner's emotional needs.
Emotional Traits,[User's Name] listens to their partner's feelings without making it about themselves.
Emotional Traits,[User's Name] self-regulates emotionally and does not require constant reassurance.
Emotional Traits,[User's Name] creates emotional safety in the relationship.
Emotional Traits,[User's Name] is emotionally open and available for conversation.
Emotional Traits,[User's Name] addresses issues directly without using tears or drama to communicate.
Emotional Traits,[User's Name] offers peace and support when their partner is stressed.
Emotional Traits,[User's Name] views emotional nurturing as a shared responsibility.
Physical Traits,[User's Name] has maintained or improved their physical appearance since the relationship began.
Physical Traits,[User's Name] dresses in a way that makes their partner feel proud to be seen with them.
Physical Traits,[User's Name] consistently prioritizes fitness and health.
Physical Traits,[User's Name] puts effort into their appearance without making excuses.
Physical Traits,[User's Name] initiates physical intimacy without needing to be prompted.
Physical Traits,[User's Name] shows affection without using it as a transaction or test.
Physical Traits,[User's Name] maintains grooming habits similar to when they first started dating.
Physical Traits,[User's Name] does not reject physical connection due to insecurity or ego.
Physical Traits,[User's Name] is sexually open, communicative, and attentive to their partner's needs.
Physical Traits,[User's Name] is perceived by their partner as respectful, attractive, and feminine.
Financial Traits,[User's Name] has a personal financial plan and contributes to building a shared future.
Financial Traits,[User's Name] focuses on what can be built together rather than material gifts.
Financial Traits,[User's Name] saves money and avoids emotional impulse spending.
Financial Traits,[User's Name] is transparent about purchases and any debt.
Financial Traits,[User's Name] avoids criticizing their partner's finances while relying on their money.
Financial Traits,[User's Name] treats money as a shared tool, not a test of masculinity.
Financial Traits,[User's Name] lives within their means and avoids chasing lifestyle images.
Financial Traits,[User's Name] openly discusses financial goals and struggles with their partner.
Financial Traits,[User's Name] contributes actively to financial planning and discipline.
Financial Traits,[User's Name] is perceived by their partner as financially responsible.
Family & Cultural Compatibility,[User's Name] respects their partner's culture as much as their own.
Family & Cultural Compatibility,[User's Name] defends their partner if disrespected by family.
Family & Cultural Compatibility,[User's Name] views marriage as a partnership, not as control over their partner.
Family & Cultural Compatibility,[User's Name] does not expect their partner to conform completely to their traditions.
Family & Cultural Compatibility,[User's Name] respects their partner's cultural values without dismissing them.
Family & Cultural Compatibility,[User's Name] brings peace when family issues cause disharmony.
Family & Cultural Compatibility,[User's Name] is willing to adapt and compromise during cultural clashes.
Family & Cultural Compatibility,[User's Name] understands and values the role of family in their partner's life.
Family & Cultural Compatibility,[User's Name] prioritizes loyalty to their partner over outside opinions.
Family & Cultural Compatibility,[User's Name] has openly discussed family roles and expectations with their partner.
Conflict Resolution Style,[User's Name] de-escalates conflicts calmly and constructively.
Conflict Resolution Style,[User's Name] starts difficult conversations with curiosity rather than accusations.
Conflict Resolution Style,[User's Name] stays focused on the current issue during disagreements.
Conflict Resolution Style,[User's Name] apologizes genuinely when wrong.
Conflict Resolution Style,[User's Name] prioritizes being understood over being right.
Conflict Resolution Style,[User's Name] does not punish their partner with withdrawal or attitude after fights.
Conflict Resolution Style,[User's Name] clearly admits mistakes and works to change behavior.
Conflict Resolution Style,[User's Name] handles difficult conversations without crying, yelling, or blaming.
Conflict Resolution Style,[User's Name] seeks clarity in conflict by asking questions rather than making assumptions.
Conflict Resolution Style,[User's Name]'s partner would describe them as someone who fights to fix issues, not just to vent.`);

// Function to handle possessive grammar for names ending in 's'
function getPossessiveForm(name: string): string {
  if (!name) return '';
  
  // Handle names ending in 's' (like James, Chris, etc.)
  // For names ending in 's', we use just the apostrophe
  if (name.endsWith('s')) {
    return name + "'";
  }
  
  return name + "'s";
}

// Function to replace [User's Name] with the actual user's name
function replaceUserName(text: string, userName: string): string {
  if (!userName) return text;
  
  const possessiveForm = getPossessiveForm(userName);
  
  return text
    .replace(/\[User's Name\]/g, userName)
    .replace(/\[User's Name\]'s/g, possessiveForm)
    .replace(/their partner/g, `${possessiveForm} partner`)
    .replace(/they're/g, `${userName} is`)
    .replace(/they /g, `${userName} `)
    .replace(/ their /g, ` ${possessiveForm} `)
    .replace(/ them/g, ` ${userName}`)
    .replace(/ they /g, ` ${userName} `);
}

// Get external questions by type with dynamic name replacement
export function getExternalQuestionsByType(
  assessmentType: string | null, 
  userName: string
): ExternalQuestion[] {
  if (!assessmentType) return [];
  
  let questions: ExternalQuestion[];
  
  switch (assessmentType) {
    case 'high-value-man':
      questions = MALE_EXTERNAL_QUESTIONS;
      break;
    case 'wife-material':
    case 'bridal-price':
      questions = FEMALE_EXTERNAL_QUESTIONS;
      break;
    default:
      return [];
  }
  
  // Replace [User's Name] with the actual user's name
  return questions.map(q => ({
    ...q,
    text: replaceUserName(q.text, userName)
  }));
}

// Get questions grouped by category
export function getExternalQuestionsByCategory(
  questions: ExternalQuestion[]
): Record<string, ExternalQuestion[]> {
  return questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, ExternalQuestion[]>);
} 