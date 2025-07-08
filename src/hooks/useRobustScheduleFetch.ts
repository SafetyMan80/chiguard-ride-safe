import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useErrorReporting } from './useErrorReporting';

interface FetchConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  rateLimit: {
    maxRequests: number;
    timeWindow: number; // in milliseconds
  };
}

const DEFAULT_CONFIG: FetchConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 15000, // Increased timeout
  rateLimit: {
    maxRequests: 10,
    timeWindow: 60000 // 10 requests per minute
  }
};

// Rate limiting store
const rateLimitStore = new Map<string, { requests: number; resetTime: number }>();

export const useRobustScheduleFetch = (serviceName: string, config: Partial<FetchConfig> = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { reportError } = useErrorReporting();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Rate limiting check
  const isRateLimited = (key: string): boolean => {
    const now = Date.now();
    const stored = rateLimitStore.get(key);
    
    if (!stored || now > stored.resetTime) {
      rateLimitStore.set(key, { requests: 1, resetTime: now + finalConfig.rateLimit.timeWindow });
      return false;
    }
    
    if (stored.requests >= finalConfig.rateLimit.maxRequests) {
      return true;
    }
    
    stored.requests++;
    return false;
  };

  const fetchWithRetry = useCallback(async (
    functionName: string,
    payload: any,
    attempt: number = 1
  ): Promise<any> => {
    try {
      setLoading(true);
      setError(null);

      // Check rate limiting
      const rateLimitKey = `${serviceName}_${functionName}`;
      if (isRateLimited(rateLimitKey)) {
        throw new Error(`Rate limit exceeded for ${serviceName}. Please wait before trying again.`);
      }

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), finalConfig.timeout)
      );

      const fetchPromise = supabase.functions.invoke(functionName, {
        body: payload
      });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        throw error;
      }

      // Log successful fetch
      await supabase.rpc('track_event', {
        _event_type: 'schedule_fetch_success',
        _event_data: {
          service: serviceName,
          attempt,
          timestamp: new Date().toISOString()
        }
      });

      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (attempt < finalConfig.maxRetries) {
        console.warn(`${serviceName} fetch attempt ${attempt} failed, retrying...`, errorMessage);
        await sleep(finalConfig.retryDelay * attempt); // Exponential backoff
        return fetchWithRetry(functionName, payload, attempt + 1);
      }

      // All retries exhausted - report error and show fallback
      reportError(error instanceof Error ? error : new Error(errorMessage), {
        component: `${serviceName}_schedule`,
        severity: 'high',
        metadata: {
          service: serviceName,
          attempts: attempt,
          payload: JSON.stringify(payload)
        }
      });

      setError(errorMessage);
      
      // Show user-friendly error with retry option
      toast({
        title: `${serviceName.toUpperCase()} Schedule Unavailable`,
        description: "Unable to fetch real-time data. Tap refresh to try again.",
        variant: "destructive"
      });

      throw error;
    } finally {
      setLoading(false);
    }
  }, [serviceName, finalConfig, toast, reportError]);

  return {
    fetchWithRetry,
    loading,
    error,
    clearError: () => setError(null)
  };
};