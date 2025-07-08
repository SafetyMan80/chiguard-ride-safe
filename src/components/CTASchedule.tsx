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
        // Map UI line names to CTA API route identifiers
        const routeMapping: { [key: string]: string } = {
          'red': 'Red',
          'blue': 'Blue', 
          'brown': 'Brn',
          'green': 'G',
          'orange': 'Org',
          'purple': 'P',
          'pink': 'Pink',
          'yellow': 'Y'
        };
        requestBody.routeId = routeMapping[selectedLine.toLowerCase()] || selectedLine;
      }
      if (selectedStation !== "all") {
        // Map UI station IDs to CTA stop IDs
        const stationMapping: { [key: string]: string } = {
          // Popular stations from city config
          "fullerton": "30057",
          "belmont-red": "30254", 
          "addison": "30278",
          "wilson": "30256",
          "95th-dan-ryan": "30089",
          "howard": "30173",
          "chicago-state": "30013",
          "north-clybourn": "30017",
          "ohare": "30171",
          "rosemont": "30044", // Fixed ID
          "jefferson-park": "30081",
          "logan-square": "30077",
          "western-blue": "30220",
          "division": "30068",
          "chicago-blue": "30067", 
          "jackson-blue": "30212",
          "uic-halsted": "30034",
          "forest-park": "30044",
          "kimball": "30297",
          "western-brown": "30293",
          "montrose": "30291",
          "sedgwick": "30282",
          "merchandise-mart": "30768",
          "harlem-lake": "30047",
          "oak-park": "30048",
          "garfield": "30099",
          "63rd-cottage-grove": "30063",
          "midway": "30063",
          "pulaski-orange": "30062",
          "halsted-orange": "30031",
          "roosevelt-orange": "30001",
          "54th-cermak": "30098",
          "california-pink": "30092",
          "damen-pink": "30090",
          "linden": "30307",
          "davis": "30303",
          "foster": "30304",
          "clark-lake": "30131",
          "roosevelt": "30001",
          "jackson": "30212",
          "lasalle-van-buren": "30031"
        };
        requestBody.stpid = stationMapping[selectedStation] || "30173"; // Default to Howard
      }
      
      console.log('🚆 CTA calling robust fetch with body:', requestBody);
      console.log('🚆 Selected line:', selectedLine, '-> mapped to routeId:', requestBody.routeId);
      console.log('🚆 Selected station:', selectedStation, '-> mapped to stpid:', requestBody.stpid);
      
      // Use robust fetch instead of direct supabase call
      const response: CTAResponse = await fetchWithRetry(
        'cta-schedule',
        Object.keys(requestBody).length > 0 ? requestBody : { stpid: '30173' }
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