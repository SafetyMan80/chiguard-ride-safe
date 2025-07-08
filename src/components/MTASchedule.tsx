import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";
import { StandardScheduleLayout } from "@/components/shared/StandardScheduleLayout";
import { MajorStationsDisplay } from "@/components/shared/MajorStationsDisplay";
import { StandardArrival, CITY_CONFIGS } from "@/types/schedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MTAResponse {
  success: boolean;
  data: StandardArrival[];
  error?: string;
  timestamp: string;
  source: string;
}

export const MTASchedule = () => {
  const [arrivals, setArrivals] = useState<StandardArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { toast } = useToast();

  const config = CITY_CONFIGS.nyc;

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
    console.log('MTA fetchArrivals called with:', { selectedLine, selectedStation, isOnline });
    
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
      
      // Convert our component parameters to what the MTA edge function expects
      if (selectedLine !== "all") {
        requestBody.lineId = selectedLine; // MTA edge function expects 'lineId'
      }
      if (selectedStation !== "all") {
        requestBody.stationId = selectedStation; // MTA edge function expects 'stationId'
      }
      
      const { data, error } = await supabase.functions.invoke('mta-schedule', {
        method: 'POST',
        body: Object.keys(requestBody).length > 0 ? requestBody : undefined
      });

      if (error) throw error;

      const response: MTAResponse = data;
      if (response.success) {
        setArrivals(response.data || []);
        setLastUpdated(new Date().toLocaleTimeString());
        toast({
          title: "Schedule Updated",
          description: `Found ${response.data?.length || 0} upcoming arrivals`,
          duration: 2000
        });
      } else {
        throw new Error(response.error || 'Failed to fetch MTA data');
      }
    } catch (error) {
      console.error('Error fetching MTA arrivals:', error);
      
      toast({
        title: "Hold tight! We're working to get real-time data",
        description: "NYC subway information will be available soon.",
        variant: "default",
        duration: 2000
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch arrivals for a specific station (for MajorStationsDisplay)
  const fetchStationArrivals = async (stationName: string): Promise<StandardArrival[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('mta-schedule', {
        method: 'POST',
        body: { 
          stationName: stationName,
          results: '5'
        }
      });

      if (error) throw error;

      const response: MTAResponse = data;
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching station arrivals:', error);
      return [];
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
    console.log('MTA fetchArrivals triggered by selectedLine/selectedStation change');
    fetchArrivals();
  }, [selectedLine, selectedStation]);

  // Initial load
  useEffect(() => {
    console.log('MTA component mounted, initial fetchArrivals call');
    fetchArrivals();
  }, []);

  // Reset station when line changes
  const handleLineChange = (newLine: string) => {
    setSelectedLine(newLine);
    if (newLine !== selectedLine && selectedStation !== "all") {
      setSelectedStation("all");
    }
  };

  const handleStationClick = (stationId: string) => {
    setSelectedStation(stationId);
    setActiveTab("detailed");
    fetchArrivals();
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Station Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <MajorStationsDisplay
            config={config}
            onStationClick={handleStationClick}
            fetchArrivals={fetchStationArrivals}
            formatArrivalTime={formatArrivalTime}
            getLineColor={getLineColor}
          />
        </TabsContent>
        
        <TabsContent value="detailed" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};