import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";
import { StandardScheduleLayout } from "@/components/shared/StandardScheduleLayout";
import { StandardArrival, CITY_CONFIGS } from "@/types/schedule";

interface SEPTAResponse {
  success: boolean;
  data: StandardArrival[];
  error?: string;
  timestamp: string;
  source: string;
}

export const SEPTASchedule = () => {
  const [arrivals, setArrivals] = useState<StandardArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  const config = CITY_CONFIGS.philadelphia;

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
      if (selectedLine !== "all") requestBody.line = selectedLine;
      if (selectedStation !== "all") requestBody.station = selectedStation;
      
      // For SEPTA, we need to send the correct station parameter for arrivals
      const payload: any = {
        action: 'arrivals'
      };
      
      // Add station parameter based on what's selected
      if (selectedStation !== "all") {
        payload.station = selectedStation;
      } else if (selectedLine !== "all") {
        payload.line = selectedLine;
      }
      
      console.log('🚇 SEPTA calling function with payload:', payload);
      
      const { data, error } = await supabase.functions.invoke('septa-schedule', {
        body: payload
      });

      if (error) throw error;

      const response: SEPTAResponse = data;
      if (response.success) {
        setArrivals(response.data || []);
        setLastUpdated(new Date().toLocaleTimeString());
        toast({
          title: "Schedule Updated",
          description: `Found ${response.data?.length || 0} upcoming arrivals`,
          duration: 2000
        });
      } else {
        throw new Error(response.error || 'Failed to fetch SEPTA data');
      }
    } catch (error) {
      console.error('❌ Error fetching SEPTA arrivals:', error);
      
      toast({
        title: "SEPTA API Error",
        description: `Failed to fetch Philadelphia transit data: ${error.message || 'Unknown error'}`,
        variant: "destructive",
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
    fetchArrivals();
  }, [selectedLine, selectedStation]);

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