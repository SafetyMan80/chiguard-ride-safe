import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Train } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SEPTAArrival } from "@/data/septaStations";
import { SEPTAStationSearch } from "@/components/septa/SEPTAStationSearch";
import { SEPTAArrivals } from "@/components/septa/SEPTAArrivals";
import { SEPTASystemOverview } from "@/components/septa/SEPTASystemOverview";

export const SEPTASchedule = () => {
  const [selectedStation, setSelectedStation] = useState("");
  const [arrivals, setArrivals] = useState<SEPTAArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchArrivals = async () => {
    if (!selectedStation.trim()) {
      toast({
        title: "Station required",
        description: "Please enter a station name to get arrivals.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('septa-schedule', {
        body: { 
          action: 'arrivals',
          station: selectedStation.trim()
        }
      });

      if (error) {
        throw error;
      }

      setArrivals(data?.arrivals || []);
      setLastUpdated(data?.lastUpdated || new Date().toISOString());
      
      toast({
        title: "✅ Schedule Updated",
        description: `Updated arrivals for ${selectedStation}`,
      });
    } catch (error) {
      console.error('Error fetching SEPTA arrivals:', error);
      toast({
        title: "Hold tight! We're working to get real-time data",
        description: "SEPTA arrivals will be available soon.",
        variant: "default"
      });
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Train className="w-5 h-5" />
            SEPTA Philadelphia Transit
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time arrival information for SEPTA trains and subway
          </p>
        </CardHeader>
        <CardContent>
          <SEPTAStationSearch
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            onFetchArrivals={fetchArrivals}
            loading={loading}
          />
        </CardContent>
      </Card>

      <SEPTAArrivals
        selectedStation={selectedStation}
        arrivals={arrivals}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      <SEPTASystemOverview />
    </div>
  );
};