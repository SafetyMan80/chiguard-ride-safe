import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";
import { useRobustScheduleFetch } from "@/hooks/useRobustScheduleFetch";
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
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { toast } = useToast();
  const { fetchWithRetry, loading, error } = useRobustScheduleFetch('la-metro');

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

    console.log('🚇 LA Metro: Starting fetch process...');
    
    try {
      // Fetch predictions for LA Metro area using robust fetch
      const requestBody = {
        action: 'predictions',
        latitude: 34.0522, // Downtown LA coordinates 
        longitude: -118.2437,
        radius: 2000 // 2km radius for better results
      };
      
      console.log('🚇 LA Metro: Sending request to edge function:', requestBody);
      
      const data = await fetchWithRetry('lametro-schedule', requestBody);

      console.log('🚇 LA Metro: Response data:', data);

      // Transform the response to match our StandardArrival format
      if (data && data.predictions && Array.isArray(data.predictions)) {
        const transformedArrivals: StandardArrival[] = data.predictions.map((pred: any) => ({
          route_name: pred.route_name || pred.route_id,
          headsign: pred.headsign || 'Unknown Destination',
          arrival_time: pred.arrival_time || 'Unknown',
          delay_seconds: pred.delay_seconds || 0,
          vehicle_id: pred.vehicle_id || '',
          stop_name: pred.stop_name || 'Unknown Stop'
        }));

        console.log('Transformed arrivals:', transformedArrivals);
        setArrivals(transformedArrivals);
        setLastUpdated(new Date().toLocaleTimeString());
        toast({
          title: "LA Metro Schedule Updated",
          description: `Found ${transformedArrivals.length} upcoming arrivals`,
          duration: 2000
        });
      } else {
        console.log('No predictions in response, checking for other data formats');
        setArrivals([]);
        toast({
          title: "No arrivals found",
          description: "No LA Metro arrivals in the area right now.",
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error fetching LA Metro arrivals:', error);
      setArrivals([]);
    }
  };

  // Mock fetch function for station arrivals (Coming Soon!)
  const fetchStationArrivals = async (stationName: string): Promise<StandardArrival[]> => {
    // Return empty array since API is coming soon
    return [];
  };

  const getLineColor = (line: string) => {
    if (!line) return "bg-gray-500";
    const lineData = config.lines.find(l => l.name && l.name.toLowerCase().includes(line.toLowerCase()));
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