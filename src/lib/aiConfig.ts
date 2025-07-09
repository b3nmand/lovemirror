// AI Service Configuration
export const AI_CONFIG = {
  // Base URL for your AI service (Streamlit app)
  BASE_URL: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8501',
  
  // API endpoints
  ENDPOINTS: {
    CHAT: '/api/chat',
    HEALTH: '/health',
  },
  
  // Request settings
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  
  // Feature flags
  ENABLE_FALLBACK: true,
  ENABLE_LOGGING: true,
};

// Environment-specific configurations
export const getAIConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  return {
    ...AI_CONFIG,
    BASE_URL: isDevelopment 
      ? 'http://localhost:8501'  // Local Streamlit development
      : AI_CONFIG.BASE_URL,      // Production URL from env
    ENABLE_LOGGING: isDevelopment,
  };
};

// Helper function to build API URLs
export const buildAPIUrl = (endpoint: string): string => {
  const config = getAIConfig();
  return `${config.BASE_URL}${endpoint}`;
};

// Default headers for AI service requests
export const getDefaultHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'LoveMirror-AI-Client/1.0',
}); 