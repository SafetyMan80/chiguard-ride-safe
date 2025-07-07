import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorReporting } from './useErrorReporting';

interface ServiceHealth {
  supabase: boolean;
  scheduleServices: Record<string, boolean>;
  lastCheck: string;
}

export const useServiceHealthCheck = () => {
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    supabase: true,
    scheduleServices: {},
    lastCheck: new Date().toISOString()
  });
  const { reportError } = useErrorReporting();

  const checkSupabaseHealth = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.from('analytics_events').select('id').limit(1);
      return !error;
    } catch (error) {
      reportError(error as Error, {
        component: 'health_check',
        severity: 'critical'
      });
      return false;
    }
  };

  const checkScheduleServiceHealth = async (service: string): Promise<boolean> => {
    try {
      // Use a lightweight test call instead of health_check action
      const { error } = await supabase.functions.invoke(`${service}-schedule`, {
        body: { test: true }
      });
      
      // If we get any response (even an error response), the service is reachable
      // Only mark as down if there's a network/connection error
      return true;
    } catch (error) {
      // Only report actual connection errors, not API errors
      const isConnectionError = error instanceof Error && 
        (error.message.includes('fetch') || error.message.includes('network'));
      
      if (isConnectionError) {
        reportError(error as Error, {
          component: `${service}_schedule_health`,
          severity: 'medium',
          metadata: { service }
        });
        return false;
      }
      
      // API errors still mean the service is reachable
      return true;
    }
  };

  const runHealthChecks = async () => {
    const supabaseHealthy = await checkSupabaseHealth();
    
    const scheduleServices = ['cta', 'mta', 'septa', 'wmata', 'marta', 'rtd', 'lametro'];
    const scheduleHealth: Record<string, boolean> = {};
    
    for (const service of scheduleServices) {
      scheduleHealth[service] = await checkScheduleServiceHealth(service);
    }

    const newHealth: ServiceHealth = {
      supabase: supabaseHealthy,
      scheduleServices: scheduleHealth,
      lastCheck: new Date().toISOString()
    };

    setServiceHealth(newHealth);

    // Report overall health status
    const unhealthyServices = Object.entries(scheduleHealth)
      .filter(([_, healthy]) => !healthy)
      .map(([service]) => service);

    if (!supabaseHealthy || unhealthyServices.length > 0) {
      await supabase.rpc('track_event', {
        _event_type: 'service_health_degraded',
        _event_data: {
          supabase_healthy: supabaseHealthy,
          unhealthy_services: unhealthyServices,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  useEffect(() => {
    runHealthChecks();
    const interval = setInterval(runHealthChecks, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return { serviceHealth, runHealthChecks };
};