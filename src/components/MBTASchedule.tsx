import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";
import { StandardScheduleLayout } from "@/components/shared/StandardScheduleLayout";
import { MajorStationsDisplay } from "@/components/shared/MajorStationsDisplay";
import { StandardArrival, CITY_CONFIGS } from "@/types/schedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState<string>("overview");
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="schedule">Live Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MajorStationsDisplay config={config} fetchArrivals={fetchArrivals} />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <StandardScheduleLayout
            config={config}
            arrivals={arrivals}
            loading={loading}
            selectedLine={selectedLine}
            selectedStation={selectedStation}
            lastUpdated={lastUpdated}
            onRefresh={handleRefresh}
            onLineChange={handleLineChange}
            onStationChange={handleStationChange}
            isOnline={isOnline}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};