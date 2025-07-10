import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";
import { StandardScheduleLayout } from "@/components/shared/StandardScheduleLayout";
import { StandardArrival, CITY_CONFIGS } from "@/types/schedule";

interface MBTAResponse {
  success: boolean;
  data: StandardArrival[];
  error?: string;
  timestamp: string;
  source: string;
}

export const MBTASchedule = () => {
  const [arrivals, setArrivals] = useState<StandardArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  const config = CITY_CONFIGS.boston;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchMBTASchedule = async () => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Please check your internet connection",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('🚇 Fetching MBTA schedule data...');

      const { data, error } = await supabase.functions.invoke('mbta-schedule', {
        body: { 
          line: selectedLine === "all" ? undefined : selectedLine,
          station: selectedStation === "all" ? undefined : selectedStation
        }
      });

      if (error) {
        console.error('MBTA API Error:', error);
        throw error;
      }

      console.log('🚇 MBTA Response:', data);

      if (data?.success && Array.isArray(data.data)) {
        setArrivals(data.data);
        setLastUpdated(new Date().toLocaleTimeString());
        
        toast({
          title: "MBTA Schedule Updated",
          description: `Found ${data.data.length} arrivals`,
        });
      } else {
        console.warn('Invalid MBTA response format:', data);
        setArrivals([]);
        toast({
          title: "No Data",
          description: "No current arrivals found for selected filters",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error fetching MBTA schedule:', error);
      setArrivals([]);
      
      toast({
        title: "MBTA Schedule Error", 
        description: "Unable to fetch real-time data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds when component is visible
  useVisibilityAwareInterval(fetchMBTASchedule, 30000);

  // Initial load - fetch immediately when component mounts
  useEffect(() => {
    fetchMBTASchedule();
  }, []); // Empty dependency array ensures this only runs on mount

  // Initial load
  useEffect(() => {
    fetchMBTASchedule();
  }, [selectedLine, selectedStation]);

  const handleRefresh = () => {
    fetchMBTASchedule();
  };

  const handleLineChange = (line: string) => {
    setSelectedLine(line);
  };

  const handleStationChange = (station: string) => {
    setSelectedStation(station);
  };

  const fetchArrivals = async (station: string): Promise<StandardArrival[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('mbta-schedule', {
        body: { 
          line: selectedLine === "all" ? undefined : selectedLine,
          station: station === "all" ? undefined : station
        }
      });

      if (error) throw error;
      return data?.success && Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error('Error fetching MBTA arrivals:', error);
      return [];
    }
  };

  const formatArrivalTime = (arrivalTime: string) => {
    // If the time is already properly formatted from the API, return as-is
    if (arrivalTime === "No Data" || arrivalTime === "Arriving" || 
        arrivalTime === "Boarding" || arrivalTime === "Arrived" ||
        arrivalTime.includes("min")) {
      return arrivalTime;
    }
    
    // For any other numeric values, parse and format
    const minutes = parseInt(arrivalTime);
    if (!isNaN(minutes)) {
      return minutes <= 1 ? "Arriving" : `${minutes} min`;
    }
    return arrivalTime;
  };

  const getLineColor = (line: string) => {
    const lineData = config.lines.find(l => l.name.toLowerCase().includes(line.toLowerCase()));
    return lineData?.color || "bg-gray-500";
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
      onRefresh={handleRefresh}
      formatArrivalTime={formatArrivalTime}
      getLineColor={getLineColor}
    />
  );
};