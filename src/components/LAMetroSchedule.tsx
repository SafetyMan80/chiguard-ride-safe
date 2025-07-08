import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";
import { StandardScheduleLayout } from "@/components/shared/StandardScheduleLayout";
import { MajorStationsDisplay } from "@/components/shared/MajorStationsDisplay";
import { StandardArrival, CITY_CONFIGS } from "@/types/schedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LAMetroResponse {
  success: boolean;
  data: StandardArrival[];
  error?: string;
  timestamp: string;
  source: string;
}

export const LAMetroSchedule = () => {
  const [arrivals, setArrivals] = useState<StandardArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { toast } = useToast();

  const config = CITY_CONFIGS.los_angeles;

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
      // LA Metro edge function expects different parameters - location-based rather than line/station
      const requestBody = {
        action: 'alerts', // Default to alerts since the current edge function is set up for location-based queries
        latitude: 34.0522, // Default LA coordinates 
        longitude: -118.2437,
        radius: 5000 // 5km radius
      };
      
      const { data, error } = await supabase.functions.invoke('lametro-schedule', {
        method: 'POST',
        body: requestBody
      });

      if (error) throw error;

      const response: LAMetroResponse = data;
      if (response.success) {
        setArrivals(response.data || []);
        setLastUpdated(new Date().toLocaleTimeString());
        toast({
          title: "Schedule Updated",
          description: `Found ${response.data?.length || 0} upcoming arrivals`,
          duration: 2000
        });
      } else {
        throw new Error(response.error || 'Failed to fetch LA Metro data');
      }
    } catch (error) {
      console.error('Error fetching LA Metro arrivals:', error);
      
      toast({
        title: "Hold tight! We're working to get real-time data",
        description: "LA Metro arrivals will be available soon.",
        variant: "default",
        duration: 2000
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock fetch function for station arrivals (Coming Soon!)
  const fetchStationArrivals = async (stationName: string): Promise<StandardArrival[]> => {
    // Return empty array since API is coming soon
    return [];
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
            config={{
              ...config,
              name: config.name + " - Coming Soon!"
            }}
            onStationClick={handleStationClick}
            fetchArrivals={fetchStationArrivals}
            formatArrivalTime={formatArrivalTime}
            getLineColor={getLineColor}
          />
        </TabsContent>
        
        <TabsContent value="detailed" className="space-y-4">
          <StandardScheduleLayout
            config={{
              ...config,
              name: config.name + " - Coming Soon!"
            }}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};