import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";
import { useRobustScheduleFetch } from "@/hooks/useRobustScheduleFetch";
import { StandardScheduleLayout } from "@/components/shared/StandardScheduleLayout";
import { StandardArrival, CITY_CONFIGS } from "@/types/schedule";

interface CTAResponse {
  success: boolean;
  data: StandardArrival[];
  error?: string;
  timestamp: string;
  source: string;
}

export const CTASchedule = () => {
  const [arrivals, setArrivals] = useState<StandardArrival[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();
  
  // Use robust fetch hook with CTA-specific config
  const { fetchWithRetry, loading, error, clearError } = useRobustScheduleFetch('CTA', {
    maxRetries: 4, // Extra retry for CTA
    retryDelay: 2000, // Longer delay for CTA API
    timeout: 20000, // Longer timeout
    rateLimit: {
      maxRequests: 8, // Conservative rate limiting
      timeWindow: 60000
    }
  });

  const config = CITY_CONFIGS.chicago;

  // Component mount debugging
  console.log('🚆 CTASchedule component mounted!');
  console.log('🚆 CTASchedule config:', config);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const fetchArrivals = async () => {
    console.log('🚆 CTA fetchArrivals called with:', { selectedLine, selectedStation, isOnline });
    
    if (!isOnline) {
      console.log('🚆 CTA offline, showing toast');
      toast({
        title: "No Internet Connection",
        description: "Please check your connection and try again.",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    clearError(); // Clear any previous errors

    try {
      const requestBody: any = {};
      
      // Only send parameters if they're actually selected (not "all")
      if (selectedLine !== "all") {
        const routeName = selectedLine.charAt(0).toUpperCase() + selectedLine.slice(1);
        requestBody.routeId = routeName;
      }
      if (selectedStation !== "all") {
        const stationMapping: { [key: string]: string } = {
          "ohare": "30171",
          "howard": "30173", 
          "95th-dan-ryan": "30089",
          "fullerton": "30057",
          "belmont-red": "30254",
          "addison": "30278",
          "wilson": "30256",
          "jackson-blue": "30212",
          "clark-lake": "30131",
          "chicago-state": "30013",
          "roosevelt": "30001",
          "logan-square": "30077",
          "merchandise-mart": "30768",
          "north-clybourn": "30017"
        };
        requestBody.stopId = stationMapping[selectedStation] || selectedStation;
      }
      
      console.log('🚆 CTA calling robust fetch with body:', requestBody);
      
      // Use robust fetch instead of direct supabase call
      const response: CTAResponse = await fetchWithRetry(
        'cta-schedule',
        Object.keys(requestBody).length > 0 ? requestBody : { stopId: '30173' }
      );

      console.log('🚆 CTA Robust fetch response:', response);
      console.log('🚆 CTA Response success:', response.success);
      console.log('🚆 CTA Response data length:', response.data?.length || 0);
      
      if (response.success) {
        setArrivals(response.data || []);
        
        // Format timestamp with Central Time (CTA timezone)
        const now = new Date();
        const centralTime = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Chicago',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(now);
        setLastUpdated(centralTime);
        
        if (response.data && response.data.length > 0) {
          toast({
            title: "CTA Schedule Updated",
            description: `Found ${response.data.length} upcoming arrivals at ${centralTime} CT`,
            duration: 2000
          });
        } else {
          toast({
            title: "No Current Arrivals",
            description: "No trains currently scheduled at this location",
            duration: 2000
          });
        }
      } else {
        console.log('🚆 CTA API returned error:', response.error);
        setArrivals([]);
        toast({
          title: "CTA Data Issue", 
          description: response.error || "Unable to fetch train data",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('🚆 CTA Complete error:', error);
      setArrivals([]);
      
      toast({
        title: "CTA Service Issue",
        description: "Having trouble connecting to train data. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const getLineColor = (line: string) => {
    const lineData = config.lines.find(l => l.name.toLowerCase().includes(line.toLowerCase()));
    return lineData?.color || "bg-gray-500";
  };

  const formatArrivalTime = (arrivalTime: string) => {
    if (arrivalTime === "Boarding" || arrivalTime === "Arrived") {
      return arrivalTime;
    }
    const minutes = parseInt(arrivalTime);
    if (!isNaN(minutes)) {
      return minutes <= 1 ? "Arriving" : `${minutes} min`;
    }
    return arrivalTime;
  };

  // Use visibility-aware interval for better performance
  useVisibilityAwareInterval(fetchArrivals, 120000); // Increased to 2 minutes to avoid rate limiting

  useEffect(() => {
    console.log('🚆 CTA useEffect triggered with selectedLine/selectedStation change', { selectedLine, selectedStation });
    console.log('🚆 CTA calling fetchArrivals now');
    fetchArrivals();
  }, [selectedLine, selectedStation]); // Removed fetchWithRetry dependency to prevent infinite loops

  // Initial load
  useEffect(() => {
    console.log('🚆 CTA component mounted, initial fetchArrivals call');
    fetchArrivals();
  }, []); // Empty dependency array for mount only

  // Add debugging for component render
  console.log('🚆 CTA Component rendering with state:', {
    arrivals: arrivals.length,
    loading,
    selectedLine,
    selectedStation,
    lastUpdated,
    isOnline
  });

  // Reset station when line changes
  const handleLineChange = (newLine: string) => {
    setSelectedLine(newLine);
    if (newLine !== selectedLine && selectedStation !== "all") {
      setSelectedStation("all");
    }
  };

  return (
    <StandardScheduleLayout
      config={config}
      selectedLine={selectedLine}
      selectedStation={selectedStation}
      arrivals={arrivals}
      loading={loading}
      lastUpdated={lastUpdated}
      isOnline={isOnline}
      onLineChange={handleLineChange}
      onStationChange={setSelectedStation}
      onRefresh={fetchArrivals}
      formatArrivalTime={formatArrivalTime}
      getLineColor={getLineColor}
    />
  );
};