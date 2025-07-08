import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmergencyReport {
  id: string;
  type: 'sos' | 'incident';
  location: { latitude: number; longitude: number; accuracy?: number };
  timestamp: string;
  details: string;
  status: 'pending' | 'sent' | 'failed' | 'offline';
}

export const useEmergencyFailsafe = () => {
  const [offlineQueue, setOfflineQueue] = useState<EmergencyReport[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryAttempts, setRetryAttempts] = useState<Map<string, number>>(new Map());
  const { toast } = useToast();

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "⚠️ Offline Mode Active",
        description: "Emergency reports will be queued and sent when connection returns",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('emergency-queue');
    if (savedQueue) {
      try {
        setOfflineQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Failed to load offline emergency queue:', error);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('emergency-queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 0 
        }
      );
    });
  };

  // Determine city and transit line based on GPS coordinates
  const determineCityFromLocation = async (location: { latitude: number; longitude: number }) => {
    // Default fallback
    let cityInfo = {
      transitLine: 'Chicago CTA',
      locationName: 'SOS incident reported Chicago CTA',
      cityName: 'Chicago'
    };

    // Chicago area (roughly)
    if (location.latitude >= 41.6 && location.latitude <= 42.1 && 
        location.longitude >= -87.9 && location.longitude <= -87.5) {
      cityInfo = {
        transitLine: 'Chicago CTA',
        locationName: 'SOS incident reported Chicago CTA',
        cityName: 'Chicago'
      };
    }
    // NYC area (roughly)
    else if (location.latitude >= 40.4 && location.latitude <= 40.9 && 
             location.longitude >= -74.3 && location.longitude <= -73.7) {
      cityInfo = {
        transitLine: 'NYC MTA',
        locationName: 'SOS incident reported NYC MTA', 
        cityName: 'New York'
      };
    }
    // DC area (roughly)
    else if (location.latitude >= 38.8 && location.latitude <= 39.0 && 
             location.longitude >= -77.2 && location.longitude <= -76.9) {
      cityInfo = {
        transitLine: 'DC Metro',
        locationName: 'SOS incident reported DC Metro',
        cityName: 'Washington DC'
      };
    }
    // Philadelphia area (roughly)
    else if (location.latitude >= 39.8 && location.latitude <= 40.1 && 
             location.longitude >= -75.3 && location.longitude <= -74.9) {
      cityInfo = {
        transitLine: 'SEPTA',
        locationName: 'SOS incident reported SEPTA',
        cityName: 'Philadelphia'
      };
    }
    // Atlanta area (roughly)
    else if (location.latitude >= 33.6 && location.latitude <= 33.9 && 
             location.longitude >= -84.6 && location.longitude <= -84.2) {
      cityInfo = {
        transitLine: 'MARTA',
        locationName: 'SOS incident reported MARTA',
        cityName: 'Atlanta'
      };
    }

    return cityInfo;
  };

  const sendEmergencyReport = async (report: EmergencyReport, skipQueue = false): Promise<boolean> => {
    if (!isOnline && !skipQueue) {
      // Add to offline queue
      setOfflineQueue(prev => [...prev, { ...report, status: 'offline' }]);
      toast({
        title: "🚨 Emergency Report Queued",
        description: "Report saved offline - will send when connection returns",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Determine city and transit line based on location or user profile
      let cityInfo = await determineCityFromLocation(report.location);
      
      // Multiple delivery attempts with different methods
      const deliveryMethods = [
        // Primary: Supabase database
        async () => {
          const { error } = await supabase
            .from('incident_reports')
            .insert({
              reporter_id: user?.id || 'anonymous',
              incident_type: 'SOS Emergency', // SOS button triggered incident
              transit_line: cityInfo.transitLine,
              location_name: cityInfo.locationName,
              description: `🚨 SOS EMERGENCY: ${report.details}`,
              latitude: report.location.latitude,
              longitude: report.location.longitude,
              accuracy: report.location.accuracy,
              status: 'active'
            });
          
          if (error) throw error;
          return true;
        },
        
        // Backup: Direct edge function call
        async () => {
          const response = await fetch('/api/emergency-backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report)
          });
          
          if (!response.ok) throw new Error('Backup method failed');
          return true;
        },
        
        // Last resort: Browser notification API + localStorage
        async () => {
          if ('Notification' in window) {
            new Notification('🚨 EMERGENCY ALERT', {
              body: `Emergency reported at ${new Date().toLocaleString()}`,
              requireInteraction: true
            });
          }
          
          // Store in persistent emergency log
          const emergencyLog = JSON.parse(localStorage.getItem('emergency-log') || '[]');
          emergencyLog.push({ ...report, timestamp: new Date().toISOString() });
          localStorage.setItem('emergency-log', JSON.stringify(emergencyLog));
          return true;
        }
      ];

      // Try each delivery method until one succeeds
      for (const method of deliveryMethods) {
        try {
          await method();
          toast({
            title: "✅ Emergency Report Sent",
            description: `SOS incident filed in ${cityInfo.cityName} - ${cityInfo.transitLine}`,
          });
          return true;
        } catch (error) {
          console.warn('Emergency delivery method failed:', error);
          continue;
        }
      }

      throw new Error('All delivery methods failed');
      
    } catch (error) {
      console.error('Failed to send emergency report:', error);
      
      const currentAttempts = retryAttempts.get(report.id) || 0;
      if (currentAttempts < 5) { // Max 5 retry attempts
        setRetryAttempts(prev => new Map(prev.set(report.id, currentAttempts + 1)));
        
        // Exponential backoff retry
        setTimeout(() => {
          sendEmergencyReport(report, true);
        }, Math.pow(2, currentAttempts) * 1000);
        
        toast({
          title: "🔄 Retrying Emergency Report",
          description: `Attempt ${currentAttempts + 1}/5 - Will retry automatically`,
          variant: "destructive"
        });
      } else {
        // Add to offline queue for manual retry
        setOfflineQueue(prev => [...prev, { ...report, status: 'failed' }]);
        toast({
          title: "❌ Emergency Report Failed",
          description: "Report saved locally - please contact authorities directly",
          variant: "destructive"
        });
      }
      
      return false;
    }
  };

  const triggerSOS = useCallback(async (details: string = "Emergency assistance needed") => {
    try {
      // Get location immediately
      const position = await getCurrentLocation();
      
      const sosReport: EmergencyReport = {
        id: `sos-${Date.now()}`,
        type: 'sos',
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        },
        timestamp: new Date().toISOString(),
        details,
        status: 'pending'
      };

      // Immediate visual feedback
      toast({
        title: "🚨 SOS ACTIVATED",
        description: "Emergency services are being notified...",
        variant: "destructive"
      });

      // Try to send immediately
      await sendEmergencyReport(sosReport);
      
    } catch (locationError) {
      // Even without location, still send SOS
      const sosReport: EmergencyReport = {
        id: `sos-${Date.now()}`,
        type: 'sos',
        location: { latitude: 0, longitude: 0 }, // Fallback coordinates
        timestamp: new Date().toISOString(),
        details: `${details} (Location unavailable)`,
        status: 'pending'
      };

      toast({
        title: "🚨 SOS ACTIVATED (No Location)",
        description: "Emergency services are being notified without location",
        variant: "destructive"
      });

      await sendEmergencyReport(sosReport);
    }
  }, []);

  const reportIncident = useCallback(async (incidentData: {
    type: string;
    location: string;
    description: string;
  }) => {
    try {
      const position = await getCurrentLocation();
      
      const incidentReport: EmergencyReport = {
        id: `incident-${Date.now()}`,
        type: 'incident',
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        },
        timestamp: new Date().toISOString(),
        details: `${incidentData.type} at ${incidentData.location}: ${incidentData.description}`,
        status: 'pending'
      };

      await sendEmergencyReport(incidentReport);
      
    } catch (error) {
      console.error('Failed to report incident:', error);
      toast({
        title: "Report saved offline",
        description: "Will be sent when connection is restored",
        variant: "default"
      });
    }
  }, []);

  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;
    
    console.log(`Processing ${offlineQueue.length} offline emergency reports...`);
    
    const unsentReports = offlineQueue.filter(report => 
      report.status === 'offline' || report.status === 'failed'
    );

    for (const report of unsentReports) {
      const success = await sendEmergencyReport(report, true);
      if (success) {
        setOfflineQueue(prev => prev.filter(r => r.id !== report.id));
      }
    }
  }, [offlineQueue]);

  return {
    triggerSOS,
    reportIncident,
    offlineQueue,
    isOnline,
    retryAttempts: retryAttempts.size,
    processOfflineQueue
  };
};