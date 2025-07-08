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

  // Initialize with proper defaults
  useEffect(() => {
    console.log('🔄 CTA Component initializing with defaults');
    setSelectedLine("all");
    setSelectedStation("all");
    // Trigger initial fetch after state is set
    setTimeout(() => {
      console.log('🔄 CTA Initial fetch triggered');
      fetchArrivals();
    }, 100);
  }, []);

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
    console.log('🚆 CTA fetchArrivals called with state:', { selectedLine, selectedStation, isOnline, loading });
    
    if (!isOnline) {
      console.log('🚆 CTA offline - aborting fetch');
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
      // Simplified approach: Use same pattern as working cities
      const requestBody: any = {};
      
      // Simple parameter passing like MTA/SEPTA
      if (selectedLine !== "all") {
        requestBody.line = selectedLine; // Use simple line ID
      }
      if (selectedStation !== "all") {
        requestBody.station = selectedStation; // Use simple station ID
      }
      
      console.log('🚆 CTA API Request Body:', requestBody);
      console.log('🚆 CTA Selected Line:', selectedLine);
      console.log('🚆 CTA Selected Station:', selectedStation);
      console.log('🚆 CTA Calling supabase function...');
      
      const { data, error } = await supabase.functions.invoke('cta-schedule', {
        body: requestBody
      });

      console.log('🚆 CTA Supabase response received');
      console.log('🚆 CTA Error:', error);
      console.log('🚆 CTA Raw Data:', data);

      if (error) {
        console.error('🚆 CTA Supabase error:', error);
        throw error;
      }

      const response: CTAResponse = data;
      console.log('🚆 CTA Parsed Response:', response);
      console.log('🚆 CTA Response Success:', response?.success);
      console.log('🚆 CTA Response Data Length:', response?.data?.length);
      console.log('🚆 CTA Response Error:', response?.error);
      
      if (response.success) {
        console.log('🚆 CTA Setting arrivals data:', response.data);
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
        console.log('🚆 CTA Updated timestamp:', centralTime);
        
        if (response.data && response.data.length > 0) {
          console.log('🚆 CTA Showing success toast');
          toast({
            title: "CTA Schedule Updated",
            description: `Found ${response.data.length} upcoming arrivals at ${centralTime} CT`,
            duration: 2000
          });
        } else {
          console.log('🚆 CTA Showing no arrivals toast');
          toast({
            title: "No Current Arrivals",
            description: "No trains currently scheduled at this location",
            duration: 2000
          });
        }
      } else {
        console.error('🚆 CTA API returned error:', response.error);
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
      console.error('🚆 CTA Error name:', error?.name);
      console.error('🚆 CTA Error message:', error?.message);
      console.error('🚆 CTA Error stack:', error?.stack);
      setArrivals([]);
      
      toast({
        title: "CTA Service Issue",
        description: `Error: ${error?.message || 'Unknown error'}. Please try again.`,
        variant: "destructive",
        duration: 3000
      });
    } finally {
      console.log('🚆 CTA Setting loading to false');
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

  // Only trigger fetch when line/station actually changes (not initialization)
  useEffect(() => {
    console.log('🚆 CTA useEffect triggered with:', { selectedLine, selectedStation });
    if (selectedLine && selectedStation) {
      console.log('🚆 CTA Calling fetchArrivals due to state change');
      fetchArrivals();
    }
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