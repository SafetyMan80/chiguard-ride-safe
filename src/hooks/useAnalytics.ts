import { supabase } from '@/integrations/supabase/client';

interface TrackEventOptions {
  eventType: string;
  eventData?: Record<string, any>;
  includeUserAgent?: boolean;
}

export const useAnalytics = () => {
  const trackEvent = async ({ 
    eventType, 
    eventData = {}, 
    includeUserAgent = true 
  }: TrackEventOptions) => {
    try {
      const userAgent = includeUserAgent ? navigator.userAgent : null;
      
      const { error } = await supabase.rpc('track_event', {
        _event_type: eventType,
        _event_data: eventData,
        _user_agent: userAgent
      });

      if (error) {
        console.error('Failed to track event:', error);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  // Convenience methods for common events
  const trackPageView = (page: string) => {
    trackEvent({
      eventType: 'page_view',
      eventData: { page, timestamp: new Date().toISOString() }
    });
  };

  const trackPWAInstall = () => {
    trackEvent({
      eventType: 'pwa_install',
      eventData: { timestamp: new Date().toISOString() }
    });
  };

  const trackUserAction = (action: string, details?: Record<string, any>) => {
    trackEvent({
      eventType: 'user_action',
      eventData: { action, ...details, timestamp: new Date().toISOString() }
    });
  };

  const trackAppLaunch = () => {
    trackEvent({
      eventType: 'app_launch',
      eventData: { 
        timestamp: new Date().toISOString(),
        referrer: document.referrer || 'direct'
      }
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackPWAInstall,
    trackUserAction,
    trackAppLaunch
  };
};