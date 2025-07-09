import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export interface ApiError extends Error {
  code?: string;
  status?: number;
  details?: any;
  hint?: string;
  statusText?: string;
  timestamp?: string;
  requestUrl?: string;
  retryCount?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  statusCode?: number;
}

export type ApiErrorHandlerOptions = {
  maxRetries?: number;
  shouldToast?: boolean;
  retryStatusCodes?: number[];
  logLevel?: 'error' | 'warn' | 'info';
};

const defaultOptions: ApiErrorHandlerOptions = {
  maxRetries: 3,
  shouldToast: true,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  logLevel: 'error'
};

/**
 * Handles API errors with retry logic and comprehensive logging
 * @param fn - The async function to execute
 * @param requestUrl - The URL or description of the request
 * @param options - Configuration options for error handling
 * @returns ApiResponse with data or error
 */
export async function handleApiError<T>(
  fn: () => Promise<T>,
  requestUrl: string,
  options?: ApiErrorHandlerOptions
): Promise<ApiResponse<T>> {
  const opts = { ...defaultOptions, ...options };
  const { maxRetries, shouldToast, retryStatusCodes, logLevel } = opts;
  
  let retryCount = 0;
  const baseDelay = 300; // milliseconds
  const errorId = Math.random().toString(36).substring(2, 15);

  while (retryCount <= maxRetries!) {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (error: any) {
      const timestamp = new Date().toISOString();
      
      // Create a standardized error object
      const apiError: ApiError = {
        name: error.name || 'Error',
        message: error.message || 'An unknown error occurred',
        code: error.code,
        status: error.status || error.statusCode,
        details: error.details,
        hint: error.hint,
        statusText: error.statusText,
        stack: error.stack,
        timestamp,
        requestUrl,
        retryCount
      };

      // Comprehensive error logging
      const errorDetails = {
        errorId,
        timestamp,
        requestUrl,
        retryCount,
        error: apiError,
      };

      // Log based on specified log level
      if (logLevel === 'error') {
        console.error(`API Error [${errorId}] - Attempt ${retryCount + 1}/${maxRetries! + 1}:`, errorDetails);
      } else if (logLevel === 'warn') {
        console.warn(`API Warning [${errorId}] - Attempt ${retryCount + 1}/${maxRetries! + 1}:`, errorDetails);
      } else {
        console.info(`API Info [${errorId}] - Attempt ${retryCount + 1}/${maxRetries! + 1}:`, errorDetails);
      }

      // Generate user-friendly error message
      let userFriendlyMessage = generateUserFriendlyMessage(apiError);

      // Specific handling for Supabase errors
      if (requestUrl.includes(import.meta.env.VITE_SUPABASE_URL) || error.code?.startsWith('PGRST')) {
        userFriendlyMessage = handleSupabaseError(error, userFriendlyMessage);
      }

      // Determine if we should retry
      const shouldRetry = 
        retryCount < maxRetries! && 
        (
          retryStatusCodes!.includes(apiError.status as number) || 
          error.message === 'NetworkError' ||
          error.message?.includes('network') ||
          error.message?.includes('timeout') ||
          error.message?.includes('connection')
        );

      if (shouldRetry) {
        // Exponential backoff with jitter
        const delay = calculateBackoffDelay(baseDelay, retryCount);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
        continue; // Retry the API call
      } else {
        // If we shouldn't retry or reached max retries, show toast and return error
        if (shouldToast) {
          toast.error(userFriendlyMessage);
        }
        
        return { 
          data: null, 
          error: apiError,
          statusCode: apiError.status 
        };
      }
    }
  }

  // This should not be reached if the loop exits normally,
  // but TypeScript requires a return statement
  return { 
    data: null, 
    error: {
      name: 'MaxRetriesError',
      message: 'Maximum retry attempts reached',
      timestamp: new Date().toISOString(),
      requestUrl,
      retryCount
    } 
  };
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(baseDelay: number, retryCount: number): number {
  // Exponential backoff: baseDelay * 2^retryCount
  const exponentialDelay = baseDelay * Math.pow(2, retryCount);
  
  // Add jitter to prevent thundering herd problem (±20%)
  const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
  
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Generate user-friendly error message based on error type
 */
function generateUserFriendlyMessage(error: ApiError): string {
  // Authentication errors
  if (error.status === 401 || error.code === 'UNAUTHENTICATED') {
    return 'Your session has expired. Please sign in again.';
  }
  
  // Permission errors
  if (error.status === 403 || error.code === 'PERMISSION_DENIED') {
    return 'You don\'t have permission to perform this action.';
  }
  
  // Not found errors
  if (error.status === 404) {
    return 'The requested resource could not be found.';
  }
  
  // Rate limiting
  if (error.status === 429) {
    return 'Too many requests. Please try again later.';
  }
  
  // Validation errors
  if (error.status === 422 || error.code === 'VALIDATION_ERROR') {
    return error.message || 'Validation error. Please check your input.';
  }
  
  // Network errors
  if (error.message?.includes('network') || error.message === 'NetworkError') {
    return 'Network connection failed. Please check your internet connection.';
  }
  
  // Server errors
  if (error.status && error.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  // Default error message
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Handle Supabase-specific errors
 */
function handleSupabaseError(error: any, defaultMessage: string): string {
  // Check for common Supabase error patterns
  if (error.code === 'PGRST301') {
    return 'Database error: Resource does not exist.';
  }
  
  if (error.code === 'PGRST204') {
    return 'No data found.';
  }
  
  if (error.code?.startsWith('22')) {
    return 'Invalid data format. Please check your input.';
  }
  
  if (error.code === '23505') {
    return 'A record with this information already exists.';
  }
  
  if (error.code === '23503') {
    return 'This operation violates database constraints.';
  }
  
  if (error.code === 'P0001') {
    return error.message || 'Database operation failed.';
  }
  
  // Auth errors
  if (error.message?.includes('Email not confirmed')) {
    return 'Please verify your email address before proceeding.';
  }
  
  if (error.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  
  // Add prefix to indicate it's a Supabase error
  return `Database error: ${defaultMessage}`;
}

/**
 * Convenience function that works directly with Supabase responses
 */
export async function handleSupabaseQuery<T, E = any>(
  query: () => Promise<{ data: T; error: E | null }>,
  requestDescription: string,
  options?: ApiErrorHandlerOptions
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await query();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    return handleApiError<T>(
      () => { throw error; }, // Re-throw the error to be caught by handleApiError
      requestDescription,
      options
    );
  }
}

/**
 * Refresh the user's session if it's expired
 */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return false;
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAt = session.expires_at;
    const isExpiringSoon = expiresAt * 1000 - Date.now() < 5 * 60 * 1000;
    
    if (isExpiringSoon) {
      const { data, error } = await supabase.auth.refreshSession();
      return !error && !!data.session;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    return false;
  }
}