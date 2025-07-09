import { z } from 'zod';

export interface Question {
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
    description: 'How you think and process information',
    gradient: 'from-blue-500 to-blue-600'
  },
  'Emotional Traits': {
    name: 'Emotional Traits',
    color: 'bg-purple-500',
    description: 'How you manage and express feelings',
    gradient: 'from-purple-500 to-purple-600'
  },
  'Physical Traits': {
    name: 'Physical Traits',
    color: 'bg-emerald-500',
    description: 'How you maintain your appearance and health',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  'Financial Traits': {
    name: 'Financial Traits',
    color: 'bg-yellow-500',
    description: 'How you handle money and resources',
    gradient: 'from-yellow-500 to-yellow-600'
  },
  'Family & Cultural Compatibility': {
    name: 'Family & Cultural Compatibility',
    color: 'bg-red-800',
    description: 'How you navigate family dynamics',
    gradient: 'from-red-800 to-red-900'
  },
  'Conflict Resolution Style': {
    name: 'Conflict Resolution Style',
    color: 'bg-rose-500',
    description: 'How you handle disagreements',
    gradient: 'from-rose-500 to-rose-600'
  }
};

// Parse CSV data into questions
function parseCSV(csvData: string): Question[] {
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

// Import CSV data
const MALE_QUESTIONS = parseCSV(`Category,Question
Mental Traits,I take accountability when I'm wrong instead of deflecting blame.
Mental Traits,I respond calmly when my partner challenges me.
Mental Traits,I am open to personal growth and avoid outdated mindsets.
Mental Traits,I listen with the intent to understand, not just to respond.
Mental Traits,I manage my emotions constructively when triggered.
Mental Traits,I reflect on how my behavior affects my partner.
Mental Traits,I am comfortable being vulnerable and see it as strength.
Mental Traits,I correct bad habits instead of expecting my partner to tolerate them.
Mental Traits,I handle constructive criticism without defensiveness.
Mental Traits,I avoid conflating being 'alpha' with emotional unavailability.
Emotional Traits,I make space for my partner's emotions without trying to fix them.
Emotional Traits,I regularly express appreciation, affection, and care non-sexually.
Emotional Traits,I am emotionally consistent in showing care.
Emotional Traits,I validate my partner's feelings instead of dismissing them.
Emotional Traits,I openly share my emotions instead of keeping them inside.
Emotional Traits,I make my partner feel emotionally safe.
Emotional Traits,I remain calm and engaged when my partner is upset.
Emotional Traits,I value emotional intimacy as much as physical intimacy.
Emotional Traits,I give reassurance without feeling controlled.
Emotional Traits,My partner feels seen, heard, and emotionally secure with me.
Physical Traits,I maintain daily hygiene and grooming habits.
Physical Traits,I stay mindful of my health and appearance since the relationship began.
Physical Traits,I dress in a way that reflects pride in my appearance.
Physical Traits,I try to impress my partner physically consistently.
Physical Traits,I am attentive to my partner's sexual needs as well as my own.
Physical Traits,I bring physical affection outside of sexual moments.
Physical Traits,I work consistently on fitness, energy, and presentation.
Physical Traits,I listen to my partner's feedback about attraction.
Physical Traits,I show effort in date nights and special occasions.
Physical Traits,My partner would describe me as physically present, attractive, and invested.
Financial Traits,I have a clear financial plan and savings habits.
Financial Traits,I am honest about my finances and avoid hiding spending/debt.
Financial Traits,I discuss financial burdens openly with my partner.
Financial Traits,I focus on building a future with long-term goals.
Financial Traits,I invest in personal growth instead of wasting money to impress others.
Financial Traits,I comfortably fulfill provider roles without resentment.
Financial Traits,I support my partner's earning success without feeling threatened.
Financial Traits,I manage money with discipline, not impulsively.
Financial Traits,I am generous in healthy ways without manipulation.
Financial Traits,My partner feels financially secure with me.
Family & Cultural Compatibility,I respect my partner's culture and avoid imposing mine.
Family & Cultural Compatibility,I protect my partner from family disrespect.
Family & Cultural Compatibility,I shield my partner from family drama and pressure.
Family & Cultural Compatibility,I make my partner feel like we're in a partnership, not just joining my tribe.
Family & Cultural Compatibility,I value her family's involvement as much as my own.
Family & Cultural Compatibility,I build healthy boundaries between my family and our relationship.
Family & Cultural Compatibility,I avoid expecting submission without offering security and respect.
Family & Cultural Compatibility,I discuss cultural clashes openly instead of dictating.
Family & Cultural Compatibility,I avoid using tradition or religion as excuses for control.
Family & Cultural Compatibility,My partner feels I integrate family values with emotional intelligence.
Conflict Resolution Style,I communicate openly instead of shutting down when angry.
Conflict Resolution Style,I avoid raising my voice, sarcasm, or threats during fights.
Conflict Resolution Style,I de-escalate conflicts instead of dominating them.
Conflict Resolution Style,I stay engaged in disagreements until resolution.
Conflict Resolution Style,I take accountability after conflicts instead of just moving on.
Conflict Resolution Style,I avoid using silence or ignoring emotional repair.
Conflict Resolution Style,I listen to my partner's pain without deflecting blame.
Conflict Resolution Style,I avoid holding grudges or bringing up past fights.
Conflict Resolution Style,I seek clarity in arguments instead of rushing to end them.
Conflict Resolution Style,My partner feels safe, heard, and respected even during disagreements.`);

const FEMALE_QUESTIONS = parseCSV(`Category,Question
Mental Traits,I remain calm and avoid escalating small disagreements into emotional reactions.
Mental Traits,I communicate calmly about what's wrong when I'm hurt instead of expecting my partner to guess.
Mental Traits,I avoid using emotional withdrawal or silence as a punishment.
Mental Traits,I take responsibility for my role in relationship problems.
Mental Traits,I avoid saying hurtful things impulsively.
Mental Traits,I stay calm and rational when my emotions are triggered.
Mental Traits,I avoid using my emotions to gain control in conflict situations.
Mental Traits,I self-reflect when my partner gives feedback instead of getting defensive.
Mental Traits,I manage my mood independently without relying on my partner to fix it.
Mental Traits,I am willing to unlearn negative patterns from past relationships.
Emotional Traits,I regularly show appreciation for my partner, not just when things go wrong.
Emotional Traits,I focus on how loved I make my partner feel as much as how loved I feel.
Emotional Traits,I acknowledge and respect my partner's emotional needs.
Emotional Traits,I listen to my partner's feelings without making it about myself.
Emotional Traits,I self-regulate emotionally and do not expect constant reassurance.
Emotional Traits,I create emotional safety in my relationship.
Emotional Traits,I am emotionally open and available to talk.
Emotional Traits,I address issues directly without using tears or drama.
Emotional Traits,I offer peace and support when my partner is stressed.
Emotional Traits,I view emotional nurturing as a shared responsibility.
Physical Traits,I have maintained or improved my physical appearance since entering the relationship.
Physical Traits,I dress in a way that makes my partner feel proud to be seen with me.
Physical Traits,I prioritize fitness and health consistently.
Physical Traits,I maintain effort in my appearance without using excuses.
Physical Traits,I initiate physical intimacy without needing prompting.
Physical Traits,I show affection without using touch as a transaction or test.
Physical Traits,I maintain grooming habits as I did when first dating.
Physical Traits,I avoid rejecting physical connection due to insecurity or ego.
Physical Traits,I am sexually open, communicative, and attentive to my partner's needs.
Physical Traits,My partner would describe my appearance as respectful, attractive, and feminine.
Financial Traits,I have my own financial plan and contribute to building our future together.
Financial Traits,I focus on what we can build together rather than what my partner can buy me.
Financial Traits,I save money and avoid spending based on impulsive feelings.
Financial Traits,I am transparent about purchases and debt with my partner.
Financial Traits,I avoid criticizing my partner's financial habits while relying on their money.
Financial Traits,I view money as a shared tool, not a test of masculinity.
Financial Traits,I live within my means and avoid chasing a lifestyle image.
Financial Traits,I openly discuss financial goals and struggles with my partner.
Financial Traits,I contribute effort, planning, and discipline toward our future together.
Financial Traits,My partner would describe me as financially responsible.
Family & Cultural Compatibility,I respect my partner's culture as much as my own.
Family & Cultural Compatibility,I defend my partner if my family disrespects them.
Family & Cultural Compatibility,I believe marriage means partnership, not bringing my partner into my family's control.
Family & Cultural Compatibility,I avoid expecting my partner to conform completely to my traditions.
Family & Cultural Compatibility,I respect my partner's cultural values without dismissing them.
Family & Cultural Compatibility,I bring peace when family is involved in our relationship.
Family & Cultural Compatibility,I adapt and compromise during cultural clashes.
Family & Cultural Compatibility,I understand and value the role of family in my partner's upbringing.
Family & Cultural Compatibility,I prioritize loyalty to my partner over outside opinions.
Family & Cultural Compatibility,I have discussed family roles and expectations openly with my partner.
Conflict Resolution Style,I de-escalate conflicts calmly and constructively.
Conflict Resolution Style,I start difficult conversations with curiosity instead of accusations.
Conflict Resolution Style,I stay focused on the current issue during disagreements.
Conflict Resolution Style,I apologize genuinely when I am wrong.
Conflict Resolution Style,I prioritize being understood over being right.
Conflict Resolution Style,I avoid punishing my partner with withdrawal or attitude after fights.
Conflict Resolution Style,I admit mistakes clearly and work to change behavior.
Conflict Resolution Style,I handle hard conversations without crying, yelling, or blaming.
Conflict Resolution Style,I seek clarity by asking questions instead of making assumptions.
Conflict Resolution Style,My partner would say I fight to fix issues, not just to vent.`);

export function getQuestionsByType(assessmentType: string | null): Question[] {
  if (!assessmentType) return [];
  
  switch (assessmentType) {
    case 'high-value-man':
      return MALE_QUESTIONS;
    case 'wife-material':
    case 'bridal-price':
      return FEMALE_QUESTIONS;
    default:
      return [];
  }
}

export function getQuestionsByCategory(questions: Question[]): Record<string, Question[]> {
  return questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, Question[]>);
}