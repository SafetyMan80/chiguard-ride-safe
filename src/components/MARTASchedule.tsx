import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StandardScheduleLayout } from "@/components/shared/StandardScheduleLayout";
import { StandardArrival, CITY_CONFIGS } from "@/types/standardSchedule";

interface MARTAResponse {
  success: boolean;
  data: StandardArrival[];
  error?: string;
  timestamp: string;
  source: string;
}

export const MARTASchedule = () => {
  const [arrivals, setArrivals] = useState<StandardArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  const config = CITY_CONFIGS.atlanta;

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
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const requestBody: any = {};
      if (selectedLine !== "all") requestBody.line = selectedLine;
      if (selectedStation !== "all") requestBody.station = selectedStation;
      
      const { data, error } = await supabase.functions.invoke('marta-schedule', {
        method: 'POST',
        body: Object.keys(requestBody).length > 0 ? requestBody : undefined
      });

      if (error) throw error;

      const response: MARTAResponse = data;
      if (response.success) {
        setArrivals(response.data || []);
        setLastUpdated(new Date().toLocaleTimeString());
        toast({
          title: "Schedule Updated",
          description: `Found ${response.data?.length || 0} upcoming arrivals`
        });
      } else {
        throw new Error(response.error || 'Failed to fetch MARTA data');
      }
    } catch (error) {
      console.error('Error fetching MARTA arrivals:', error);
      
      const errorMessage = error.message || 'Unknown error';
      let userMessage = "Failed to fetch MARTA schedule. Please try again.";
      
      if (errorMessage.includes('502') || errorMessage.includes('gateway')) {
        userMessage = "MARTA's servers are currently experiencing issues. Please try again later.";
      } else if (errorMessage.includes('MARTA API key')) {
        userMessage = "MARTA service is not properly configured.";
      }
      
      toast({
        title: "MARTA Schedule Unavailable",
        description: userMessage,
        variant: "destructive"
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

  useEffect(() => {
    fetchArrivals();
    const interval = setInterval(fetchArrivals, 30000);
    return () => clearInterval(interval);
  }, [selectedLine, selectedStation]);

  return (
    <StandardScheduleLayout
      config={config}
      selectedLine={selectedLine}
      selectedStation={selectedStation}
      arrivals={arrivals}
      loading={loading}
      lastUpdated={lastUpdated}
      isOnline={isOnline}
      onLineChange={setSelectedLine}
      onStationChange={setSelectedStation}
      onRefresh={fetchArrivals}
      formatArrivalTime={formatArrivalTime}
      getLineColor={getLineColor}
    />
  );
};