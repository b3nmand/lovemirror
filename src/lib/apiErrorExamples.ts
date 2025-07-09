import { handleApiError, handleSupabaseQuery } from './apiErrorHandler';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

// Example 1: Basic usage with fetch API
export async function fetchUserData(userId: string) {
  const apiUrl = `/api/users/${userId}`;

  const apiCall = async () => {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const error = new Error(errorBody.message || response.statusText || 'Failed to fetch user data');
      error.status = response.status;
      throw error;
    }
    return response.json();
  };

  const { data, error } = await handleApiError(apiCall, apiUrl);

  if (error) {
    console.error('Error fetching user data:', error);
    return null;
  }

  return data;
}

// Example 2: Using with Supabase queries
export async function getUserProfile(userId: string) {
  return handleSupabaseQuery(
    () => supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    'Get user profile'
  );
}

// Example 3: Using in a React component with loading state
export function useApiCall<T>(
  apiFn: () => Promise<{ data: T | null; error: Error | null }>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = async () => {
    try {
      setLoading(true);
      const { data: responseData, error: responseError } = await apiFn();
      
      if (responseError) {
        setError(responseError);
        setData(null);
      } else {
        setData(responseData);
        setError(null);
      }
    } catch (err) {
      setError(err as Error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, execute };
}

// Example 4: Using with external APIs
export async function fetchWeatherData(city: string) {
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
  const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;
  
  return handleApiError(
    async () => {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error?.message || 'Failed to fetch weather data');
        error.status = response.status;
        error.details = errorData;
        throw error;
      }
      return response.json();
    },
    'Weather API request',
    { maxRetries: 2 } // Custom options
  );
}

// Example 5: Using with form submissions
export async function submitFormData(formData: any) {
  const apiUrl = '/api/submit-form';
  
  const { data, error } = await handleApiError(
    async () => {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Failed to submit form');
        error.status = response.status;
        error.details = errorData;
        throw error;
      }
      
      return response.json();
    },
    'Form submission',
    { shouldToast: true }
  );
  
  return { success: !error, data, error };
}

// Example 6: Using with file uploads
export async function uploadFile(file: File) {
  const apiUrl = '/api/upload';
  
  const formData = new FormData();
  formData.append('file', file);
  
  return handleApiError(
    async () => {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = new Error('Failed to upload file');
        error.status = response.status;
        throw error;
      }
      
      return response.json();
    },
    'File upload',
    {
      maxRetries: 1, // Only retry once for file uploads
      retryStatusCodes: [500, 503] // Only retry on server errors
    }
  );
}