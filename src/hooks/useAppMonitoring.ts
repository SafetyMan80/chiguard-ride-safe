import { useEffect } from 'react';
import { useErrorReporting } from './useErrorReporting';
import { useServiceHealthCheck } from './useServiceHealthCheck';
import { supabase } from '@/integrations/supabase/client';

export const useAppMonitoring = () => {
  const { reportError } = useErrorReporting();
  const { serviceHealth } = useServiceHealthCheck();

  useEffect(() => {
    // Monitor page load performance
    const logPerformanceMetrics = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        const metrics = {
          dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          load_complete: navigation.loadEventEnd - navigation.loadEventStart,
          first_paint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
          first_contentful_paint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };

        supabase.rpc('track_event', {
          _event_type: 'performance_metrics',
          _event_data: {
            ...metrics,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });
      }
    };

    // Log performance after page load
    if (document.readyState === 'complete') {
      setTimeout(logPerformanceMetrics, 1000);
    } else {
      window.addEventListener('load', () => setTimeout(logPerformanceMetrics, 1000));
    }

    // Monitor critical user journeys
    const logUserJourney = (action: string, metadata?: any) => {
      supabase.rpc('track_event', {
        _event_type: 'user_journey',
        _event_data: {
          action,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          ...metadata
        }
      });
    };

    // Track app initialization
    logUserJourney('app_initialized');

    // Monitor for memory leaks
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryData = {
          used_js_heap_size: memory.usedJSHeapSize,
          total_js_heap_size: memory.totalJSHeapSize,
          js_heap_size_limit: memory.jsHeapSizeLimit
        };

        // Alert if memory usage is high
        if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
          reportError(new Error('High memory usage detected'), {
            component: 'memory_monitor',
            severity: 'medium',
            metadata: memoryData
          });
        }

        supabase.rpc('track_event', {
          _event_type: 'memory_metrics',
          _event_data: {
            ...memoryData,
            timestamp: new Date().toISOString()
          }
        });
      }
    };

    // Monitor memory every 2 minutes
    const memoryInterval = setInterval(monitorMemory, 2 * 60 * 1000);

    return () => {
      clearInterval(memoryInterval);
    };
  }, [reportError]);

  // Expose methods for manual monitoring
  const logUserAction = (action: string, metadata?: any) => {
    supabase.rpc('track_event', {
      _event_type: 'user_action',
      _event_data: {
        action,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ...metadata
      }
    });
  };

  return {
    serviceHealth,
    logUserAction
  };
};