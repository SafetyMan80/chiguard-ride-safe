import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { StandardScheduleLayout } from "@/components/shared/StandardScheduleLayout";
import { StandardArrival, CITY_CONFIGS } from "@/types/schedule";
import { supabase } from "@/integrations/supabase/client";

interface CTAResponse {
  success: boolean;
  data: StandardArrival[];
  error?: string;
  timestamp: string;
  source: string;
}

export const CTASchedule = () => {
  console.log('🏗️ CTASchedule component mounted/re-rendered');
  
  const [arrivals, setArrivals] = useState<StandardArrival[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  console.log('🏗️ CTASchedule current state:', { selectedLine, selectedStation });

  const config = CITY_CONFIGS.chicago;

  // Debug state changes
  useEffect(() => {
    console.log('🔄 CTASchedule state changed:', { selectedLine, selectedStation });
  }, [selectedLine, selectedStation]);

  // Force reset to correct defaults on mount
  useEffect(() => {
    console.log('🔄 Forcing state reset to defaults');
    setSelectedLine("all");
    setSelectedStation("all");
  }, []); // Only run once on mount

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
    if (!isOnline) {
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
      const requestBody: any = {};
      
      // Map UI line names to CTA API route identifiers
      if (selectedLine !== "all") {
        const routeMapping: { [key: string]: string } = {
          'red': 'Red',
          'blue': 'Blue', 
          'brown': 'Brn',
          'green': 'G',        // Fixed: was missing
          'orange': 'Org',
          'purple': 'P',
          'pink': 'Pink',
          'yellow': 'Y'
        };
        requestBody.routeId = routeMapping[selectedLine.toLowerCase()] || selectedLine;
      }
      
      // Map UI station IDs to CTA stop IDs
      if (selectedStation !== "all") {
        const stationMapping: { [key: string]: string } = {
          "clark-lake": "30131",
          "fullerton": "30057",
          "belmont": "30254",
          "howard": "30173",
          "95th-dan-ryan": "30089",
          "roosevelt": "30001",
          "ohare": "30171",
          "forest-park": "30044",
          "jefferson-park": "30081",
          "logan-square": "30077",
          "midway": "30063",
          "roosevelt-orange": "30001",
          "harlem-lake": "30047",
          "garfield": "30099",
          "kimball": "30297",
          "merchandise-mart": "30768",
          "54th-cermak": "30098",
          "linden": "30307",
          "dempster-skokie": "30308"
        };
        const mappedStationId = stationMapping[selectedStation] || "30173";
        console.log('🚉 Station mapping:', { selectedStation, mappedStationId, availableStations: Object.keys(stationMapping) });
        requestBody.stpid = mappedStationId;
      }
      
      console.log('🚆 CTA calling function with payload:', requestBody);
      console.log('🚆 Selected station:', selectedStation);
      console.log('🚆 Selected line:', selectedLine);
      
      const { data, error } = await supabase.functions.invoke('cta-schedule', {
        body: Object.keys(requestBody).length > 0 ? requestBody : { stpid: '30173' }
      });

      if (error) throw error;

      const response: CTAResponse = data;
      console.log('🚆 CTA Response:', response);
      
      if (response.success) {
        console.log('🚆 CTA Response data:', response.data);
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
    } finally {
      setLoading(false);
    }
  };

  const getLineColor = (line: string) => {
    const lineData = config.lines.find(l => l.name.toLowerCase().includes(line.toLowerCase()));
    return lineData?.color || "bg-gray-500";
  };

  const formatArrivalTime = (arrivalTime: string) => {
    console.log('🕒 Formatting arrival time:', arrivalTime);
    if (arrivalTime === "Boarding" || arrivalTime === "Arrived" || arrivalTime === "Approaching") {
      return arrivalTime;
    }
    const minutes = parseInt(arrivalTime);
    if (!isNaN(minutes)) {
      return minutes <= 1 ? "Arriving" : `${minutes} min`;
    }
    const result = arrivalTime;
    console.log('🕒 Formatted result:', result);
    return result;
  };

  useEffect(() => {
    fetchArrivals();
  }, [selectedLine, selectedStation]);

  // Reset station when line changes
  const handleLineChange = (newLine: string) => {
    console.log('🚆 Line change:', { from: selectedLine, to: newLine });
    setSelectedLine(newLine);
    if (newLine !== selectedLine && selectedStation !== "all") {
      console.log('🚆 Resetting station due to line change');
      setSelectedStation("all");
    }
  };

  const handleStationChange = (newStation: string) => {
    console.log('🚉 Station change:', { from: selectedStation, to: newStation });
    setSelectedStation(newStation);
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
      onStationChange={handleStationChange}
      onRefresh={fetchArrivals}
      formatArrivalTime={formatArrivalTime}
      getLineColor={getLineColor}
    />
  );
};