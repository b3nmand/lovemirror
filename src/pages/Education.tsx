import React, { useState, useEffect } from 'react';
import { Book, DollarSign, MessageCircle, Heart, Users, Brain, ChevronLeft, ArrowRight, Clock, BookOpen } from 'lucide-react';
import { marked } from 'marked';
import { marked as markedRenderer } from 'marked';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Article {
  title: string;
  preview: string;
  content: string;
  readTime?: number;
}

interface Topic {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  articles: Article[];
}

const TOPICS: Topic[] = [
  {
    id: 'finance',
    title: 'Financial Management',
    icon: DollarSign,
    description: 'Learn about budgeting, saving, and financial planning for couples',
    articles: [
      {
        title: 'Joint vs. Separate Bank Accounts: Which Is Best for Your Relationship?',
        preview: 'Explore the pros and cons of different banking approaches for couples and find what works best for your relationship.',
        readTime: 6,
        content: `
# Joint vs. Separate Bank Accounts: Which Is Best for Your Relationship?

Money can be a sensitive topic in relationships, but how you manage it together can make or break your financial harmony. One of the biggest decisions couples face is whether to merge finances with a joint account, keep things separate, or use a hybrid approach.

## 1. Joint Bank Accounts: Sharing Everything

**Pros:**
- **Transparency** – No hidden spending; both partners see all transactions.
- **Simplified budgeting** – Easier to manage shared expenses (rent, bills, groceries).
- **Unified financial goals** – Helps couples save together for big purchases (home, vacation, retirement).

**Cons:**
- **Less independence** – Some may feel restricted in personal spending.
- **Potential conflicts** – Disagreements can arise if one partner overspends.

**Best for:** Couples with aligned spending habits and full financial trust.

## 2. Separate Bank Accounts: Keeping Finances Independent

**Pros:**
- **Autonomy** – Each partner maintains control over their own money.
- **Fewer money fights** – No arguments over personal spending choices.
- **Protection in financial imbalances** – Useful if one partner has debt or different income levels.

**Cons:**
- **More complicated bill-splitting** – Requires extra effort to track shared expenses.
- **Less teamwork** – May hinder long-term financial planning.

**Best for:** Couples who value financial independence or are in newer relationships.

## 3. The Hybrid Approach: Best of Both Worlds

Many couples opt for a combination:

- A joint account for shared expenses (mortgage, utilities, groceries).
- Separate accounts for personal spending (hobbies, gifts, individual savings).

**Benefits:**
- **Fairness** – Shared responsibilities while maintaining personal freedom.
- **Flexibility** – Adaptable as financial situations change (e.g., one partner takes a pay cut).

## Key Takeaways

- Joint accounts promote transparency but require trust.
- Separate accounts offer independence but may complicate shared goals.
- Hybrid systems are a popular middle ground.

## Conclusion

There's no one-size-fits-all answer—what matters most is open communication and choosing a system that aligns with your relationship dynamics. Discuss your preferences, test different setups, and adjust as needed.
        `,
      },
      {
        title: 'How to Build Financial Trust in Your Relationship',
        preview: 'Learn practical strategies to manage money together, avoid conflicts, and build lasting financial harmony.',
        readTime: 7,
        content: `
# How to Build Financial Trust in Your Relationship

Money disagreements are a leading cause of relationship stress. But when couples build financial trust, they create a stronger partnership—both emotionally and economically. Whether you're newly dating or years into marriage, these strategies will help you foster transparency, teamwork, and confidence in your shared finances.

## 1. Start with Open Money Conversations

Many couples avoid talking about money until problems arise. Instead:
- **Schedule a "money date"** – Discuss incomes, debts, and financial goals in a relaxed setting.
- **Share credit scores & spending habits** – Full transparency prevents surprises later.

## 2. Set Shared Financial Goals

Working toward common objectives strengthens trust. Examples:

- Saving for a home down payment.
- Paying off student loans or credit card debt.
- Planning for retirement or a dream vacation.

**Tip:** Use a visual tracker (spreadsheet or app) to monitor progress together.

## 3. Create a Budget That Works for Both

A budget shouldn't feel restrictive—it should empower you.
- **50/30/20 rule** – 50% needs, 30% wants, 20% savings/debt.
- **Allow "no-judgment" spending** – Agree on a monthly personal spending limit.

## 4. Handle Financial Imbalances with Care

If one partner earns more or has debt:
- **Avoid resentment** – Contributions don't always have to be 50/50.
- **Adjust responsibilities** – Higher earner might cover a larger share of bills.

## 5. Regularly Check In & Adjust

Money situations change—review finances every few months to:

- Update budgets.
- Celebrate progress.
- Address concerns before they escalate.

## Key Takeaways

- Talk openly about money early and often.
- Set shared goals to stay motivated.
- Budget fairly while allowing personal freedom.
- Adapt as needed—financial trust grows over time.

## Conclusion

Financial trust isn't built overnight, but with honesty, teamwork, and patience, you and your partner can create a secure and stress-free money relationship. Start small, keep communicating, and watch your financial—and emotional—connection grow stronger.
        `,
      },
    ],
  },
  {
    id: 'communication',
    title: 'Communication Skills',
    icon: MessageCircle,
    description: 'Master effective communication and active listening',
    articles: [
      {
        title: 'Non-Violent Communication',
        preview: 'Learn how to express needs without causing conflict...',
        readTime: 8,
        content: `
# Non-Violent Communication: The Key to Conflict-Free Relationships

Non-Violent Communication (NVC) is a powerful framework developed by Marshall Rosenberg that helps people communicate effectively without triggering defensiveness or conflict. By focusing on observations, feelings, needs, and requests, NVC creates a path to mutual understanding and connection.

## The Four Components of NVC

### 1. Observations
Start by stating objective facts without judgment or interpretation.

**Instead of:** "You never help around the house."
**Try:** "I notice the dishes have been in the sink for three days."

### 2. Feelings
Express how you feel about the observation, using "I" statements.

**Instead of:** "You're making me angry."
**Try:** "I feel frustrated and overwhelmed."

### 3. Needs
Connect your feelings to your underlying needs or values.

**Instead of:** "Because you're lazy."
**Try:** "Because I need support and partnership in maintaining our home."

### 4. Requests
Make a clear, positive, actionable request (not a demand).

**Instead of:** "You need to do the dishes right now!"
**Try:** "Would you be willing to help wash the dishes before dinner tonight?"

## Putting It All Together

A complete NVC statement might sound like:

"When I see dishes piling up in the sink for three days (observation), I feel frustrated and overwhelmed (feelings) because I need support and partnership in maintaining our home (needs). Would you be willing to help wash the dishes before dinner tonight? (request)"

## Benefits of NVC in Relationships

- **Reduces defensiveness** by avoiding blame and criticism
- **Increases empathy** by focusing on universal human needs
- **Prevents escalation** of conflicts
- **Creates win-win solutions** through clear requests
- **Builds emotional intimacy** through vulnerable expression

## Common Pitfalls to Avoid

1. **Disguised demands** - When your "request" has strings attached
2. **Vague language** - Using terms like "always" or "never"
3. **Analyzing or diagnosing** - "You're just being selfish"
4. **Focusing on strategies instead of needs** - "I need you to do the dishes" vs. "I need support"

## Practice Exercise

Think of a recent conflict in your relationship. Try reframing your communication using the NVC format:

1. What did you observe? (Just the facts)
2. How did you feel? (Your emotions)
3. What need wasn't being met? (Your underlying needs)
4. What specific request could you make? (Clear, positive action)

Remember, NVC is a practice that takes time to master. Be patient with yourself and your partner as you learn this new language of compassion.
`,
      },
      {
        title: 'Active Listening Techniques',
        preview: 'Improve your relationship through better listening...',
        readTime: 5,
        content: `
# Active Listening: The Relationship Superpower You Need

Have you ever been in a conversation where you felt completely unheard? Or perhaps you were physically present but mentally crafting your response instead of truly listening? Active listening is the antidote to these common communication breakdowns—and it might be the most underrated skill for building strong relationships.

## What Is Active Listening?

Active listening is the practice of being fully present and engaged when someone is speaking. It involves not just hearing words, but understanding the complete message being sent, including emotions and underlying needs.

## The 5 Core Techniques of Active Listening

### 1. Give Your Full Attention

- Put away your phone and other distractions
- Maintain appropriate eye contact (cultural norms vary)
- Use open body language (uncrossed arms, facing the speaker)
- Nod occasionally to show engagement

### 2. Practice Reflective Listening

- Paraphrase what you've heard in your own words
- "So what I'm hearing is..."
- "It sounds like you're saying..."
- This confirms understanding and shows you're engaged

### 3. Ask Clarifying Questions

- "Could you tell me more about...?"
- "What did you mean when you said...?"
- "How did that make you feel?"
- Questions should open up the conversation, not close it down

### 4. Validate Emotions

- "That sounds really frustrating."
- "I can understand why you'd feel that way."
- Validation doesn't mean agreement—it means acknowledging feelings

### 5. Avoid Interrupting or Problem-Solving

- Let the speaker finish their thoughts
- Don't jump to solutions unless explicitly asked
- Sometimes people just need to be heard, not fixed

## Why Active Listening Transforms Relationships

- **Creates emotional safety** - Partners feel secure sharing vulnerable thoughts
- **Prevents misunderstandings** - Reduces conflicts based on incorrect assumptions
- **Deepens intimacy** - Fosters genuine connection and understanding
- **Builds trust** - Shows your partner they matter to you

## Common Barriers to Active Listening

1. **Formulating responses** while the other person is still speaking
2. **Filtering** through your own beliefs and experiences
3. **Rehearsing** what you'll say next
4. **Judging** the content before fully understanding
5. **Being right** - Focusing on winning rather than understanding

## Practice Exercise: The 3-Minute Listen

1. Set a timer for 3 minutes
2. Have your partner speak about something important to them
3. Your only job is to listen actively—no interrupting
4. When the timer ends, summarize what you heard and ask if you understood correctly
5. Switch roles

Start with easy topics before tackling challenging ones!

## Conclusion

Active listening isn't just a communication technique—it's an act of love. When you truly listen to your partner, you're saying, "You matter to me. Your thoughts and feelings are important." In a world full of distractions, giving someone your complete attention might be the most meaningful gift you can offer.
`,
      },
    ],
  },
  {
    id: 'intimacy',
    title: 'Intimacy & Connection',
    icon: Heart,
    description: 'Build deeper emotional and physical connections',
    articles: [
      {
        title: 'Emotional Intimacy: The Heart of a Strong Relationship',
        preview: 'Want to feel closer to your partner? Learn how emotional intimacy builds trust, deepens love, and creates an unbreakable bond in your relationship.',
        readTime: 6,
        content: `
# Emotional Intimacy: The Heart of a Strong Relationship

Emotional intimacy is the foundation of a deep, fulfilling relationship. It's what makes you feel truly seen, heard, and valued by your partner—beyond just physical attraction or shared interests. But how do you cultivate it? In this post, we'll explore what emotional intimacy really means, why it matters, and practical ways to strengthen it in your relationship.

## 1. What Is Emotional Intimacy?

Emotional intimacy is the ability to:
✔ Share your true thoughts and feelings without fear of judgment.
✔ Be vulnerable about fears, dreams, and insecurities.
✔ Feel deeply connected even in silence.

Without it, relationships can feel superficial or lonely, even if everything else seems fine.

## 2. Why Emotional Intimacy Matters

Research shows that couples with strong emotional bonds:
✅ Handle conflicts better.
✅ Feel more satisfied in their relationships.
✅ Experience greater long-term happiness.

## 3. How to Build Emotional Intimacy
### A. Practice Deep Listening

    Put away distractions and focus fully when your partner speaks.

    Reflect back what you hear ("It sounds like you're feeling stressed about work—is that right?").

### B. Share Your Inner World

    Go beyond surface talk ("How was your day?") and ask meaningful questions:
    "What's something you've been overthinking lately?"
    "What's a childhood memory that shaped you?"

### C. Create Rituals of Connection

    Daily check-ins – Spend 10 minutes sharing highs and lows.

    Weekly gratitude exchanges – Name one thing you appreciate about each other.

### D. Embrace Vulnerability

    Start small: "I felt hurt when you canceled our date, but I was afraid to say anything."

    The more you open up, the safer it becomes for your partner to do the same.

## 4. Common Barriers (And How to Overcome Them)

    Fear of judgment → Reassure each other: "You can tell me anything."

    Busy schedules → Prioritize quality over quantity—even 5 minutes of undivided attention helps.

    Past hurts → Consider couples therapy if trust is deeply broken.

## Key Takeaways

    Emotional intimacy is about vulnerability, trust, and deep connection.

    Build it through active listening, meaningful conversations, and small daily rituals.

    The more you nurture it, the stronger and more resilient your relationship becomes.

## Conclusion

Emotional intimacy isn't built overnight—it's a daily practice of choosing courage over comfort. Start today: Share one honest feeling with your partner, and watch your bond grow deeper.
        `,
      },
      {
        title: 'The Power of Physical Affection: How Touch Strengthens Love',
        preview: 'From holding hands to cuddling, physical affection is more than just fun—it\'s science-backed glue for relationships. Discover how to keep the spark alive through touch.',
        readTime: 6,
        content: `
# The Power of Physical Affection: How Touch Strengthens Love

Remember the electric thrill of your partner's touch early in your relationship? Physical affection—whether a hug, kiss, or casual brush of the hand—is a powerful way to maintain connection, even years in. But why does it matter so much, and how can you keep it alive? Let's explore the science and soul of touch in relationships.

## 1. Why Physical Affection Matters

    Releases bonding hormones (oxytocin) that reduce stress and increase trust.

    Nonverbal communication – A squeeze of the hand can say "I'm here for you" better than words.

    Keeps romance alive – Couples who touch often report higher relationship satisfaction.

## 2. Types of Physical Affection (Beyond Sex)

✔ Everyday touch – Hand-holding, shoulder rubs, playful taps.
✔ Comfort touch – Hugs when stressed, cuddling while watching TV.
✔ Romantic touch – Kissing, slow dances, lingering embraces.

## 3. How to Increase Physical Affection
### A. Start Small & Be Consistent

    Greet each other with a 6-second hug (the time needed to release oxytocin).

    Hold hands during walks or while cooking together.

### B. Sync Touch to Emotional Cues

    Notice when your partner needs comfort (a hand on their back after a hard day).

    Celebrate wins with a high-five or kiss ("I'm so proud of you!").

### C. Prioritize Non-Sexual Touch

    60% of women say they crave affection without it leading to sex.

    Try a 10-minute cuddle session with zero expectations.

### D. Communicate Your Needs

    Use gentle requests: "I'd love more hugs—would you be up for that?"

    If your partner isn't touchy, find alternatives (e.g., foot rubs while talking).

## 4. When Affection Fades: How to Rekindle It

    Schedule touch (yes, really!): "Let's cuddle every night before sleep."

    Try something new – Massages, couple's yoga, or even a dance class.

    Address underlying issues – Stress, resentment, or body image concerns can block intimacy.

## Key Takeaways

    Touch is a biological need that fosters security and love.

    Small, consistent gestures (hugs, hand-holds, cuddles) matter more than grand gestures.

    Talk openly about preferences—everyone's "touch language" is different.

## Conclusion

Physical affection is the silent language of love. Whether you're naturally touchy or learning to be, prioritizing it can transform your relationship—one hug, kiss, or gentle touch at a time. Tonight, reach for your partner's hand and see how it feels.
        `,
      },
    ],
  },
  {
    id: 'culture',
    title: 'Cultural Traditions',
    icon: Users,
    description: 'Understand different cultural approaches to relationships',
    articles: [
      {
        title: 'Cross-Cultural Relationships',
        preview: 'Love knows no borders—but blending cultures in a relationship takes work. Learn how to navigate differences, honor traditions, and create a shared life filled with respect and joy.',
        readTime: 7,
        content: `
# Cross-Cultural Relationships: How to Celebrate Differences and Build Harmony

Cross-cultural relationships are a beautiful fusion of languages, traditions, and worldviews. But they also come with unique challenges, from clashing holiday rituals to conflicting family expectations. Whether you're dating someone from another country or a different cultural background, this guide will help you celebrate diversity while building a strong, harmonious partnership.

## 1. Common Challenges in Cross-Cultural Relationships

    Communication styles – Direct vs. indirect communication can lead to misunderstandings.

    Family expectations – Pressure to uphold traditions (e.g., marriage customs, gender roles).

    Holidays and rituals – Deciding whose traditions to prioritize (e.g., Diwali vs. Christmas).

## 2. Strategies to Navigate Cultural Differences
### A. Talk Openly About Values

    Discuss non-negotiables early: "What traditions are most important to you?"

    Share stories about your upbringing to build empathy.

### B. Create New, Shared Traditions

    Blend rituals: Host a fusion holiday meal or celebrate both cultural New Years.

    Example: A couple mixing Mexican Día de los Muertos with Japanese Obon to honor ancestors together.

### C. Set Boundaries with Families

    Politely assert your needs: "We appreciate your input, but we've decided to XYZ."

    Introduce partners to family customs gradually to avoid overwhelm.

### D. Learn Each Other's Language (Literally and Figuratively)

    Study basic phrases in your partner's native language.

    Understand cultural nuances (e.g., the meaning of silence in some Asian cultures).

## 3. The Benefits of Cross-Cultural Love

    Expanded perspectives – Discover new foods, art, and ways of thinking.

    Resilient problem-solving – Navigating differences strengthens teamwork.

    Raising multicultural kids – A gift of dual heritage and open-mindedness.

## Key Takeaways

    Communicate early about cultural priorities and dealbreakers.

    Blend traditions to create a unique shared identity.

    Educate yourselves—curiosity reduces conflicts.

## Conclusion

Cross-cultural relationships aren't about erasing differences but embracing them as strengths. With patience, respect, and creativity, you can build a love story that bridges worlds.
        `,
      },
      {
        title: 'Traditional vs Modern Values',
        preview: 'Struggling to balance traditional values with modern ideals? Learn how couples can honor heritage while embracing equality, communication, and personal growth.',
        readTime: 7,
        content: `
# Traditional vs. Modern Values: Balancing Heritage and Progress in Relationships

Every relationship grapples with the tug-of-war between tradition and modernity. Should you follow your parents' marriage advice or forge your own path? Can gender roles coexist with equality? This post explores how to honor cultural heritage while embracing values that fit your modern partnership.

## 1. Clash of Values: Common Tensions

    Gender roles – Traditional expectations (e.g., "men provide, women nurture") vs. egalitarian partnerships.

    Marriage timelines – Family pressure to marry early vs. prioritizing career/self-discovery.

    Parenting styles – Raising kids with strict cultural norms vs. progressive approaches.

## 2. How to Find Balance
### A. Identify What Matters Most

    Separate cultural guilt from genuine values. Ask: "Does this tradition align with who we are today?"

    Example: Keeping a ritual like Friday family dinners but ditching outdated gender-based tasks.

### B. Modernize Traditions

    Refresh customs to reflect equality:

        Both partners cook for Lunar New Year.

        A bride wears a traditional saree and gives a wedding speech.

### C. Communicate with Older Generations

    Bridge the gap with empathy: "We respect your wisdom, but we're trying something new."

    Share successes: "Let us show you how we've blended your teachings with our values."

### D. Embrace "Third Culture" Identity

    Create a hybrid lifestyle: Mix modern communication (joint decision-making) with traditional respect (honoring elders).

## 3. Case Study: A Couple's Journey

    Challenge: A Nigerian-American woman and her partner clashed over his family's expectation that she quit her job after marriage.

    Solution: They compromised by hosting a traditional Nigerian wedding ceremony while agreeing to equally split household duties.

## 4. When to Seek Support

    If conflicts over values feel unresolvable, consider:

        Couples therapy (find a culturally competent counselor).

        Community groups for bicultural/multicultural couples.

## Key Takeaways

    Not all traditions need to be discarded—reimagine them to fit your partnership.

    Respectfully push back on harmful norms (e.g., sexism, rigidity).

    Build a "third culture" that honors your roots and your growth.

## Conclusion

Balancing traditional and modern values isn't about choosing sides—it's about crafting a relationship that respects the past while embracing the future. By communicating openly and staying true to your shared vision, you can create a partnership that feels both authentic and empowering.
        `,
      },
    ],
  },
  {
    id: 'psychology',
    title: 'Relationship Psychology',
    icon: Brain,
    description: 'Learn about attachment styles and relationship patterns',
    articles: [
      {
        title: 'Understanding Attachment Styles: How Your Past Shapes Your Relationship',
        preview: 'Did you know your childhood affects how you love today? Discover the four attachment styles, how they impact relationships, and ways to build security with your partner.',
        readTime: 8,
        content: `
# Understanding Attachment Styles: How Your Past Shapes Your Relationship

Have you ever wondered why some people crave constant reassurance in relationships, while others avoid emotional closeness? The answer often lies in attachment styles—deep-rooted patterns formed in childhood that shape how we connect with partners. By understanding your style (and your partner's), you can break cycles of conflict and create a stronger, more secure bond.

## 1. What Are Attachment Styles?

Developed by psychologist John Bowlby, attachment theory identifies four primary ways people relate to others:

    Secure Attachment – Comfortable with intimacy and independence.

    Anxious Attachment – Craves closeness but fears abandonment.

    Avoidant Attachment – Values independence over emotional connection.

    Disorganized Attachment – Mixed behaviors due to past trauma.

## 2. How Attachment Styles Show Up in Relationships
### A. Secure Attachment

    Strengths: Trusts easily, communicates needs calmly, handles conflict well.

    Challenges: May struggle to relate to partners with insecure styles.

### B. Anxious Attachment

    Behaviors: Overthinks texts, seeks constant reassurance, fears rejection.

    Example: "Why haven't they replied? Do they still love me?"

### C. Avoidant Attachment

    Behaviors: Pulls away during conflict, avoids vulnerability, prioritizes space.

    Example: "I need time alone—don't take it personally."

### D. Disorganized Attachment

    Behaviors: Hot-and-cold actions, struggles to trust, fears intimacy.

    Root Cause: Often linked to childhood trauma or inconsistent caregiving.

## 3. How to Work with Your Attachment Style
If You're Anxious:

    Practice self-soothing: Journal or meditate when fears arise.

    Replace "What if they leave?" with "I am worthy of love."

If You're Avoidant:

    Start small: Share one vulnerable feeling per week.

    Remind yourself: "Needing others doesn't make me weak."

If You're Disorganized:

    Seek therapy to process past trauma.

    Build trust slowly with consistent, safe partners.

For All Couples:

    Talk openly about your attachment styles.

    Reassure each other – Anxious partners need consistency; avoidant partners need respect for space.

## 4. Can You Change Your Attachment Style?

Yes! With self-awareness and effort, you can move toward earned secure attachment:

    Secure relationships over time rewire your brain.

    Therapy (individual or couples) accelerates growth.

## Key Takeaways

    Attachment styles explain why you react the way you do in relationships.

    Secure bonds are built through trust, communication, and consistency.

    Understanding your partner's style reduces conflict and builds empathy.

## Conclusion

Your attachment style isn't a life sentence—it's a starting point for growth. By recognizing patterns and practicing new behaviors, you and your partner can create a relationship that feels safe, loving, and secure.
        `,
      },
      {
        title: 'Breaking Negative Relationship Patterns: How to Stop the Cycle',
        preview: 'Stuck in the same fights? Learn how to identify and break toxic relationship patterns with science-backed strategies for healthier communication and connection.',
        readTime: 7,
        content: `
# Breaking Negative Relationship Patterns: How to Stop the Cycle

Every couple has arguments, but when the same fights repeat—criticism, defensiveness, silent treatments—it's a sign of negative patterns. These cycles drain intimacy and erode trust. The good news? With awareness and teamwork, you can replace destructive habits with healthier ones. Let's explore how.

## 1. Common Negative Patterns in Relationships

    The Blame Game – "You always…" vs. taking responsibility.

    Pursuer-Distancer Dynamic – One partner pushes for connection; the other withdraws.

    Stonewalling – Shutting down during conflict (silent treatment).

    Projection – Unresolved past hurts affecting current reactions.

## 2. Why We Repeat Negative Patterns

    Brain wiring – Familiar patterns feel "safe," even if harmful.

    Unmet needs – Anger often masks deeper feelings (e.g., fear of abandonment).

    Learned behavior – Repeating dynamics from childhood or past relationships.

## 3. Steps to Break the Cycle
### Step 1: Identify Triggers

    Track fights in a journal: "What happened before we argued?"

    Example: Feeling ignored → lashing out.

### Step 2: Pause Before Reacting

    Use a time-out signal: "I need 10 minutes to calm down."

    Practice deep breathing to reset your nervous system.

### Step 3: Reframe Communication

    Replace "You" statements with "I" language:
    ❌ "You never listen!"
    ✅ "I feel unheard when I'm interrupted."

### Step 4: Address the Root Cause

    Ask: "What's the fear beneath this fight?"

        Criticism → "I'm scared you don't care."

        Withdrawal → "I'm afraid of being controlled."

### Step 5: Create New Rituals

    After fights: Repair with a hug or kind words.

    Weekly check-ins: "How can I support you better?"

## 4. When to Seek Help

    If patterns persist, consider couples therapy for tools like:

        Emotionally Focused Therapy (EFT) – Addresses attachment needs.

        Cognitive Behavioral Therapy (CBT) – Changes thought-behavior loops.

## Key Takeaways

    Negative patterns stem from unmet needs and past experiences.

    Break cycles with self-awareness, pauses, and compassionate communication.

    Professional support can provide tailored strategies.

## Conclusion

Breaking negative patterns isn't about perfection—it's about progress. Each time you choose understanding over blame, you rebuild trust and intimacy. Start today: Pick one small habit to change, and watch your relationship transform.
        `,
      },
    ],
  },
];

export default function Education() {
  const [selectedTopic, setSelectedTopic] = useState<Topic>(TOPICS[0]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  // Debug logging
  useEffect(() => {
    console.log('Selected topic:', selectedTopic.title);
    console.log('Articles in topic:', selectedTopic.articles?.length || 0);
    console.log('Available topics:', TOPICS.map(t => ({ id: t.id, title: t.title, articles: t.articles.length })));
  }, [selectedTopic]);

  const handleArticleSelect = (article: Article) => {
    console.log('Opening article:', article.title);
    setSelectedArticle(article);
    window.scrollTo(0, 0);
    setReadingProgress(0);
  };

  const handleBackToArticles = () => {
    setSelectedArticle(null);
  };

  // Handle scroll for reading progress
  useEffect(() => {
    if (!selectedArticle) return;

    const handleScroll = () => {
      if (!document.getElementById('article-content')) return;
      
      const contentElement = document.getElementById('article-content')!;
      const totalHeight = contentElement.scrollHeight - contentElement.clientHeight;
      const scrollPosition = contentElement.scrollTop;
      
      if (totalHeight > 0) {
        setReadingProgress((scrollPosition / totalHeight) * 100);
      }
    };

    const contentElement = document.getElementById('article-content');
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [selectedArticle]);

  // Find related articles based on current article
  const getRelatedArticles = () => {
    if (!selectedArticle) return [];
    
    // Get articles from the same topic except the current one
    const sameTopicArticles = selectedTopic.articles.filter(
      article => article.title !== selectedArticle.title
    );
    
    // Get articles from other topics (maximum 2)
    let otherTopicArticles: Article[] = [];
    TOPICS.forEach(topic => {
      if (topic.id !== selectedTopic.id) {
        otherTopicArticles = [...otherTopicArticles, ...topic.articles.slice(0, 1)];
      }
    });
    
    // Combine and return up to 3 articles
    return [...sameTopicArticles, ...otherTopicArticles].slice(0, 3);
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Article Reading View */}
        {selectedArticle ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={handleBackToArticles}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-xs sm:text-sm"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              Back to Articles
            </Button>

            {/* Reading Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${readingProgress}%` }}
              />
            </div>

            {/* Article Header */}
            <Card className="bg-gradient-to-r from-pink-50/80 to-purple-50/80 backdrop-blur-sm border-none shadow-md">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-pink-100 to-purple-100">
                    <selectedTopic.icon className="w-4 h-4 sm:w-6 sm:h-6 text-pink-500" />
                  </div>
                  <Badge variant="secondary" className="bg-white/80 text-xs sm:text-sm">
                    {selectedTopic.title}
                  </Badge>
                </div>
                <CardTitle className="text-lg sm:text-2xl md:text-3xl lg:text-4xl mb-2">
                  {selectedArticle.title}
                </CardTitle>
                {selectedArticle.readTime && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{selectedArticle.readTime} min read</span>
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* Article Content */}
            <Card className="shadow-md">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <ScrollArea 
                  id="article-content"
                  className="h-[60vh] sm:h-[70vh] pr-2 sm:pr-4"
                >
                  {selectedArticle.content ? (
                    <div 
                      className="prose prose-sm sm:prose-base md:prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: markedRenderer(selectedArticle.content) 
                      }}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Alert>
                        <AlertDescription>
                          Article content is not available. Please try again later.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Related Articles */}
            {getRelatedArticles().length > 0 && (
              <Card className="shadow-md">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-lg sm:text-xl">Related Articles</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {getRelatedArticles().map((article) => (
                      <Card 
                        key={article.title}
                        className="cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => handleArticleSelect(article)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <h3 className="font-medium text-xs sm:text-sm mb-2 line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {article.preview}
                          </p>
                          {article.readTime && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{article.readTime} min read</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <>
            <Card className="text-center mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-pink-50/80 to-purple-50/80 backdrop-blur-sm border-none shadow-md">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <Book className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4" style={{ 
                  color: 'transparent',
                  background: 'linear-gradient(90deg, #ff0099, #9900ff)',
                }} />
                <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl" style={{ 
                  background: 'linear-gradient(90deg, #ff0099, #9900ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Relationship Education</CardTitle>
                <CardDescription className="text-sm sm:text-base md:text-lg">
                  Explore resources to strengthen your relationship knowledge
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Category toggles */}
            <div className="mb-4 sm:mb-6 flex flex-col gap-2 max-w-xs">
              {Array.isArray(TOPICS) && TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={`w-full px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-left text-sm sm:text-base
                    ${selectedTopic.id === topic.id
                      ? 'bg-white text-pink-700 border-2 border-pink-500 shadow-md'
                      : 'bg-white text-gray-900 hover:text-purple-600 hover:border-pink-300 border border-gray-200'}
                  `}
                  style={{ outline: 'none' }}
                >
                  {topic.title}
                </button>
              ))}
            </div>

            {/* Articles grid */}
            <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {selectedTopic.articles && selectedTopic.articles.length > 0 ? (
                selectedTopic.articles.map((article, index) => (
                <Card 
                  key={`${selectedTopic.id}-${index}`}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => handleArticleSelect(article)}
                >
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50">
                        <selectedTopic.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-pink-500" />
                      </div>
                      <Badge variant="secondary" className="text-xs sm:text-sm">
                        {selectedTopic.title}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2 line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-3">
                          {article.preview}
                        </p>
                        <div className="flex items-center justify-between">
                          {article.readTime && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{article.readTime} min read</span>
                            </div>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-pink-600 hover:text-pink-700 text-xs"
                          >
                            Read Article
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <Alert>
                    <AlertDescription>
                      No articles available for this topic yet. Please check back later.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}