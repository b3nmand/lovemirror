import { getAIConfig, buildAPIUrl, getDefaultHeaders } from './aiConfig';

interface BookRecommendationPayload {
  assessmentScores: Record<string, number>;
  userContext: {
    profile: {
      name: string;
      gender: string;
      region: string;
      cultural_context: string;
    };
  };
}

interface BookRecommendationResponse {
  success: boolean;
  chapter_title?: string;
  chapter_excerpt?: string;
  recommendation_reason?: string;
  error?: string;
}

interface AIRequestPayload {
  userInput: string;
  userContext: {
    profile: {
      name: string;
      gender: string;
      region: string;
      cultural_context: string;
    };
    assessmentScores: Record<string, number>;
    delusionalScore: number | null;
    compatibilityScore: number | null;
  };
  chatHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface AIResponse {
  success: boolean;
  response?: string;
  error?: string;
}

/**
 * Get hybrid AI response (AI first, fallback to book chapters)
 */
export async function getHybridAIResponse(payload: AIRequestPayload): Promise<AIResponse> {
  const { userInput, userContext, chatHistory } = payload;
  const config = getAIConfig();
  const url = buildAPIUrl('/api/chat');

  try {
    // Format the request for the hybrid AI service
    const requestBody = {
      user_input: userInput,
      user_context: userContext,
      chat_history: chatHistory,
    };

    if (config.ENABLE_LOGGING) {
      console.log('[Hybrid AI] Sending request:', { url, requestBody });
    }

    // Make the API call to the hybrid AI service
    const response = await fetch(url, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config.TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Hybrid AI] Error: Non-OK response`, { url, status: response.status, errorText });
      throw new Error(`Hybrid AI service responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (config.ENABLE_LOGGING) {
      console.log('[Hybrid AI] Received response:', data);
    }

    return {
      success: true,
      response: data.response || 'No response received from AI service',
    };

  } catch (error) {
    console.error('[Hybrid AI] Error:', { url, error });
    
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request to hybrid AI service timed out. Please try again later.',
        };
      }
      
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: `Unable to connect to hybrid AI service at ${url}. Please check your network connection or try again later.`,
        };
      }
      
      return {
        success: false,
        error: `Hybrid AI service error: ${error.message}`,
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred while communicating with the hybrid AI service.',
    };
  }
}

/**
 * Get book recommendation based on assessment scores (fallback only)
 */
export async function getBookRecommendation(payload: BookRecommendationPayload): Promise<BookRecommendationResponse> {
  const { assessmentScores, userContext } = payload;
  const config = getAIConfig();
  const url = buildAPIUrl('/api/recommendation');

  try {
    // Format the request for the book recommendation service
    const requestBody = {
      assessment_scores: assessmentScores,
      user_context: userContext,
    };

    if (config.ENABLE_LOGGING) {
      console.log('[Book Recommendation] Sending request:', { url, requestBody });
    }

    // Make the API call to the book recommendation service
    const response = await fetch(url, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config.TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Book Recommendation] Error: Non-OK response`, { url, status: response.status, errorText });
      throw new Error(`Book recommendation service responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (config.ENABLE_LOGGING) {
      console.log('[Book Recommendation] Received response:', data);
    }

    return {
      success: true,
      chapter_title: data.chapter_title,
      chapter_excerpt: data.chapter_excerpt,
      recommendation_reason: data.recommendation_reason,
    };

  } catch (error) {
    console.error('[Book Recommendation] Error:', { url, error });
    
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request to book recommendation service timed out. Please try again later.',
        };
      }
      
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: `Unable to connect to book recommendation service at ${url}. Please check your network connection or try again later.`,
        };
      }
      
      return {
        success: false,
        error: `Book recommendation service error: ${error.message}`,
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred while communicating with the book recommendation service.',
    };
  }
}

/**
 * Send a request to the AI service
 */
export async function callAIService(payload: AIRequestPayload): Promise<AIResponse> {
  const { userInput, userContext, chatHistory } = payload;
  const config = getAIConfig();
  const url = buildAPIUrl(config.ENDPOINTS.CHAT);

  try {
    // Format the request for your AI service
    const requestBody = {
      user_input: userInput,
      user_context: {
        profile: userContext.profile,
        assessment_scores: userContext.assessmentScores,
        delusional_score: userContext.delusionalScore,
        compatibility_score: userContext.compatibilityScore,
      },
      chat_history: chatHistory,
    };

    if (config.ENABLE_LOGGING) {
      console.log('[AI Service] Sending request:', { url, requestBody });
    }

    // Make the API call to your AI service
    const response = await fetch(url, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config.TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI Service] Error: Non-OK response`, { url, status: response.status, errorText });
      throw new Error(`AI service responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (config.ENABLE_LOGGING) {
      console.log('[AI Service] Received response:', data);
    }

    return {
      success: true,
      response: data.response || data.message || 'No response received from AI service',
    };

  } catch (error) {
    console.error('[AI Service] Error:', { url, error });
    
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request to AI service timed out. Please try again later.',
        };
      }
      
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: `Unable to connect to AI service at ${url}. Please check your network connection or try again later.`,
        };
      }
      
      return {
        success: false,
        error: `AI service error: ${error.message}`,
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred while communicating with the AI service.',
    };
  }
}

/**
 * Fallback AI response generator for when the AI service is unavailable
 */
export function generateFallbackResponse(userInput: string, context: any): string {
  const responses = [
    `I understand you're asking about "${userInput}". Based on your relationship profile, I'd recommend focusing on open communication and mutual understanding. Consider how your communication patterns can be enhanced.`,
    
    `Your question about "${userInput}" is important for relationship growth. Looking at your assessment data, I suggest exploring deeper emotional connection and shared goal alignment.`,
    
    `Regarding "${userInput}", your compatibility score suggests there's room for growth. Try to see things from your partner's perspective and validate their feelings.`,
    
    `Your question touches on important aspects of modern relationships. Consider how traditional values and contemporary expectations can be balanced in your situation.`,
    
    `Based on your assessment scores, "${userInput}" relates to areas where you might want to focus. I'd recommend working on emotional awareness and trust-building.`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Test the AI service connection
 */
export async function testAIConnection(): Promise<boolean> {
  const config = getAIConfig();
  const url = buildAPIUrl(config.ENDPOINTS.HEALTH);
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (config.ENABLE_LOGGING) {
      console.log('[AI Service] Health check response:', { url, status: response.status });
    }
    return response.ok;
  } catch (error) {
    console.error('[AI Service] Health check failed:', { url, error });
    return false;
  }
}

/**
 * Get AI service status
 */
export async function getAIStatus(): Promise<{
  isAvailable: boolean;
  message: string;
}> {
  const isAvailable = await testAIConnection();
  
  return {
    isAvailable,
    message: isAvailable 
      ? 'AI service is available' 
      : 'AI service is currently unavailable. Using fallback responses.',
  };
} 