import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data?: any;
}

interface SecurityMetrics {
  events_last_24h: number;
  events_last_7d: number;
  unique_ips_24h: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
}

export const useSecurityMonitoring = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkSecurityAlerts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: { action: 'check_security_alerts' }
      });

      if (error) throw error;

      setAlerts(data.alerts || []);
      
      // Show critical alerts as toasts
      data.alerts?.forEach((alert: SecurityAlert) => {
        if (alert.severity === 'critical') {
          toast({
            title: "🚨 Critical Security Alert",
            description: alert.message,
            variant: "destructive"
          });
        }
      });

    } catch (error) {
      console.error('Failed to check security alerts:', error);
      toast({
        title: "Security Check Failed",
        description: "Unable to retrieve security alerts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeThreatPatterns = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: { action: 'analyze_threat_patterns' }
      });

      if (error) throw error;

      setMetrics(data.analysis?.summary || null);
      
      return data.analysis;
    } catch (error) {
      console.error('Failed to analyze threat patterns:', error);
      return null;
    }
  };

  const generateSecurityReport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: { action: 'generate_security_report' }
      });

      if (error) throw error;

      return data.report;
    } catch (error) {
      console.error('Failed to generate security report:', error);
      return null;
    }
  };

  // Auto-check for alerts on mount and every 5 minutes
  useEffect(() => {
    checkSecurityAlerts();
    const interval = setInterval(checkSecurityAlerts, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    metrics,
    loading,
    checkSecurityAlerts,
    analyzeThreatPatterns,
    generateSecurityReport
  };
};