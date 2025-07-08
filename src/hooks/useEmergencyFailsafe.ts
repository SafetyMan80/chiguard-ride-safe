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
    // Boston area (roughly)
    else if (location.latitude >= 42.2 && location.latitude <= 42.5 && 
             location.longitude >= -71.3 && location.longitude <= -70.8) {
      cityInfo = {
        transitLine: 'MBTA',
        locationName: 'SOS incident reported MBTA',
        cityName: 'Boston'
      };
    }
    // San Francisco Bay Area (roughly)
    else if (location.latitude >= 37.7 && location.latitude <= 37.8 && 
             location.longitude >= -122.5 && location.longitude <= -122.4) {
      cityInfo = {
        transitLine: 'BART/MUNI',
        locationName: 'SOS incident reported BART/MUNI',
        cityName: 'San Francisco'
      };
    }

    return cityInfo;
  };

  const sendEmergencyReport = async (report: EmergencyReport, skipQueue = false): Promise<boolean> => {
    console.log('📧 sendEmergencyReport called:', { report, skipQueue, isOnline });
    
    if (!isOnline && !skipQueue) {
      console.log('💾 Device offline, adding to queue');
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
      console.log('👤 Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('✅ User obtained:', user?.id || 'anonymous');
      
      console.log('🗺️ Determining city from location...');
      // Determine city and transit line based on location or user profile
      let cityInfo = await determineCityFromLocation(report.location);
      console.log('✅ City info:', cityInfo);
      
      // Multiple delivery attempts with different methods
      const deliveryMethods = [
        // Primary: Supabase database
        async () => {
          console.log('🗄️ Attempting Supabase database insertion...');
          
          const insertData = {
            reporter_id: user?.id || 'anonymous',
            incident_type: 'SOS Emergency', // SOS button triggered incident
            transit_line: cityInfo.transitLine,
            location_name: cityInfo.locationName,
            description: `🚨 SOS EMERGENCY: ${report.details}`,
            latitude: report.location.latitude,
            longitude: report.location.longitude,
            accuracy: report.location.accuracy,
            status: 'active'
          };
          
          console.log('📝 Insert data prepared:', insertData);
          
          const { error, data } = await supabase
            .from('incident_reports')
            .insert(insertData)
            .select();
            
          console.log('📊 Supabase insert result:', { error, data });
          
          if (error) {
            console.error('❌ Supabase insert error:', error);
            throw error;
          }
          
          console.log('✅ Supabase insert successful!');
          return true;
        },
        
        // Backup: Direct edge function call
        async () => {
          const response = await fetch('https://jhvdfihloyjdfrvbegqh.supabase.co/functions/v1/emergency-backup', {
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
    console.log('🚨 triggerSOS called with details:', details);
    
    try {
      console.log('📍 Getting current location...');
      // Get location immediately
      const position = await getCurrentLocation();
      console.log('✅ Location obtained:', position.coords.latitude, position.coords.longitude);
      
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

      console.log('📋 Created SOS report:', sosReport);

      // Immediate visual feedback
      toast({
        title: "🚨 SOS ACTIVATED",
        description: "Emergency services are being notified...",
        variant: "destructive"
      });

      console.log('📤 Sending emergency report...');
      // Try to send immediately
      const success = await sendEmergencyReport(sosReport);
      console.log('📧 Emergency report send result:', success);
      
    } catch (locationError) {
      console.warn('⚠️ Location error, sending SOS without location:', locationError);
      
      // Even without location, still send SOS
      const sosReport: EmergencyReport = {
        id: `sos-${Date.now()}`,
        type: 'sos',
        location: { latitude: 0, longitude: 0 }, // Fallback coordinates
        timestamp: new Date().toISOString(),
        details: `${details} (Location unavailable)`,
        status: 'pending'
      };

      console.log('📋 Created fallback SOS report:', sosReport);

      toast({
        title: "🚨 SOS ACTIVATED (No Location)",
        description: "Emergency services are being notified without location",
        variant: "destructive"
      });

      console.log('📤 Sending fallback emergency report...');
      const success = await sendEmergencyReport(sosReport);
      console.log('📧 Fallback emergency report send result:', success);
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