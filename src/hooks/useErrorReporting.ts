import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ErrorReport {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  component?: string;
  user_agent: string;
  url: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const useErrorReporting = () => {
  const { toast } = useToast();

  const reportError = async (error: Error, context?: {
    component?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
  }) => {
    try {
      const errorReport: ErrorReport = {
        error_type: error.name || 'UnknownError',
        error_message: error.message,
        stack_trace: error.stack,
        component: context?.component,
        user_agent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        severity: context?.severity || 'medium'
      };

      // Log to analytics_events table for tracking
      await supabase.rpc('track_event', {
        _event_type: 'error_occurred',
        _event_data: {
          ...errorReport,
          metadata: context?.metadata
        }
      });

      // Show user-friendly message for critical errors
      if (context?.severity === 'critical') {
        toast({
          title: "Service Temporarily Unavailable",
          description: "We're experiencing technical difficulties. Please try again in a few moments.",
          variant: "destructive"
        });
      }

      console.error('Error reported:', errorReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      reportError(new Error(event.message), {
        component: 'global',
        severity: 'high',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    };

    // Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      reportError(error, {
        component: 'promise_rejection',
        severity: 'high'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return { reportError };
};