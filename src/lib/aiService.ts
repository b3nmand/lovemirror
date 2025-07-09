import { getAIConfig, buildAPIUrl, getDefaultHeaders } from './aiConfig';

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
 * Send a request to the AI service
 */
export async function callAIService(payload: AIRequestPayload): Promise<AIResponse> {
  const { userInput, userContext, chatHistory } = payload;
  const config = getAIConfig();

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
      console.log('[AI Service] Sending request:', requestBody);
    }

    // Make the API call to your AI service
    const response = await fetch(buildAPIUrl(config.ENDPOINTS.CHAT), {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config.TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`AI service responded with status: ${response.status}`);
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
    console.error('[AI Service] Error:', error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out. Please try again.',
        };
      }
      
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Unable to connect to AI service. Please check your connection and try again.',
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
  try {
    const response = await fetch(buildAPIUrl(config.ENDPOINTS.HEALTH), {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    return response.ok;
  } catch (error) {
    console.error('[AI Service] Health check failed:', error);
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