import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/apiErrorHandler';

interface UseApiOptions<T, P> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  dependencies?: any[];
  enabled?: boolean;
  initialData?: T | null;
  params?: P;
}

interface UseApiReturn<T, P> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  execute: (params?: P) => Promise<void>;
  reset: () => void;
}

/**
 * A React hook for handling API calls with automatic error handling, loading states,
 * and data caching.
 * 
 * @param apiFn - The API function to call
 * @param options - Configuration options
 * @returns Object with data, error, loading state, and execution functions
 */
export function useApi<T, P = any>(
  apiFn: (params?: P) => Promise<{ data: T | null; error: ApiError | null }>,
  options: UseApiOptions<T, P> = {}
): UseApiReturn<T, P> {
  const {
    onSuccess,
    onError,
    dependencies = [],
    enabled = true,
    initialData = null,
    params
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const execute = useCallback(async (executionParams?: P) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: responseData, error: responseError } = await apiFn(executionParams ?? params);
      
      if (responseError) {
        setError(responseError);
        if (onError) {
          onError(responseError);
        }
      } else if (responseData) {
        setData(responseData);
        if (onSuccess) {
          onSuccess(responseData);
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      if (onError) {
        onError(apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFn, onSuccess, onError, params]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  useEffect(() => {
    if (enabled) {
      execute();
    }
  }, [enabled, execute, ...dependencies]);

  return { data, error, loading, execute, reset };
}

/**
 * A hook for handling form submissions with API integration
 */
export function useApiSubmit<T, P>(
  submitFn: (data: P) => Promise<{ data: T | null; error: ApiError | null }>,
  options: Omit<UseApiOptions<T, P>, 'enabled' | 'params'> = {}
) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = async (formData: P) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);
      
      const { data: responseData, error: responseError } = await submitFn(formData);
      
      if (responseError) {
        setError(responseError);
        if (options.onError) {
          options.onError(responseError);
        }
        return false;
      } else {
        setData(responseData);
        setSuccess(true);
        if (options.onSuccess && responseData) {
          options.onSuccess(responseData);
        }
        return true;
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      if (options.onError) {
        options.onError(apiError);
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setSuccess(false);
    setSubmitting(false);
  };

  return { submit, submitting, success, data, error, reset };
}