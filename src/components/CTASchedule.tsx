import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";
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
  const [loading, setLoading] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  const config = CITY_CONFIGS.chicago;

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
    console.log('🚆 CTA starting fetch process...');
    console.log('🚆 CTA config lines:', config.lines);
    console.log('🚆 CTA config object:', config);
    
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

    setLoading(true);
    try {
      // CTA doesn't require special actions - just pass the station/route parameters
      const requestBody: any = {};
      
      // Only send parameters if they're actually selected (not "all")
      if (selectedLine !== "all") {
        // Convert line ID to CTA route name (red -> Red, blue -> Blue, etc.)
        const routeName = selectedLine.charAt(0).toUpperCase() + selectedLine.slice(1);
        requestBody.routeId = routeName;
      }
      if (selectedStation !== "all") {
        // Map station ID to CTA stop ID
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
      
      console.log('🚆 CTA API call with body:', requestBody);
      
      const { data, error } = await supabase.functions.invoke('cta-schedule', {
        body: Object.keys(requestBody).length > 0 ? requestBody : { stopId: '30173' }
      });

      console.log('🚆 CTA API response received:', { data, error });
      console.log('🚆 CTA API response data details:', JSON.stringify(data, null, 2));

      if (error) throw error;

      const response: CTAResponse = data;
      if (response.success) {
        setArrivals(response.data || []);
        setLastUpdated(new Date().toLocaleTimeString());
        console.log('🚆 CTA Success:', response.data?.length || 0, 'arrivals');
      } else {
        console.log('🚆 CTA API returned error:', response.error);
        // Still show the error in toast but don't throw
        setArrivals([]);
      }
    } catch (error) {
      console.error('🚆 CTA Error details:', error);
      console.error('🚆 CTA Error message:', error.message);
      console.error('🚆 CTA Error stack:', error.stack);
      
      // Set empty arrivals on error
      setArrivals([]);
      
      toast({
        title: "Hold tight! We're working to get real-time data",
        description: "CTA train information will be available soon.",
        variant: "default",
        duration: 2000
      });
    } finally {
      setLoading(false);
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
  useVisibilityAwareInterval(fetchArrivals, 60000); // Reduced to 60 seconds

  useEffect(() => {
    console.log('🚆 CTA useEffect triggered with selectedLine/selectedStation change', { selectedLine, selectedStation });
    console.log('🚆 CTA calling fetchArrivals now');
    fetchArrivals();
  }, [selectedLine, selectedStation]);

  // Initial load
  useEffect(() => {
    console.log('🚆 CTA component mounted, initial fetchArrivals call');
    fetchArrivals();
  }, []);

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