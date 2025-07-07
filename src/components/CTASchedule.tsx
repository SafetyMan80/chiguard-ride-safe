import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { type CTAArrival, type CTARoute, type Station } from "@/data/ctaStations";
import { CTALineStationSelector } from "./cta/CTALineStationSelector";
import { CTAArrivals } from "./cta/CTAArrivals";
import { CTASystemOverview } from "./cta/CTASystemOverview";
import { CTADebug } from "./cta/CTADebug";
import { CTAHelpSection } from "./cta/CTAHelpSection";

export const CTASchedule = () => {
  const [stopId, setStopId] = useState("");
  const [arrivals, setArrivals] = useState<CTAArrival[]>([]);
  const [routes, setRoutes] = useState<CTARoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setRoutesLoading(true);
      console.log('🚊 Fetching CTA routes...');
      
      const { data, error } = await supabase.functions.invoke('cta-schedule');
      
      console.log('📊 CTA routes response:', { data, error });
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }
      
      if (data && data.type === 'routes' && Array.isArray(data.data)) {
        console.log('✅ Setting routes:', data.data);
        setRoutes(data.data);
      } else {
        console.warn('⚠️ Unexpected routes data format:', data);
        setRoutes([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching routes:', error);
      // Show user-friendly message instead of technical errors
      toast({
        title: "Hold tight! We're working to get real-time data",
        description: "CTA train information will be available soon. You can still search stations.",
        variant: "default",
      });
      setRoutes([]);
    } finally {
      setRoutesLoading(false);
    }
  };

  const fetchArrivals = async () => {
    await fetchArrivalsForStopId(stopId);
  };

  const fetchArrivalsForStopId = async (selectedStopId: string) => {
    if (!selectedStopId.trim()) {
      toast({
        title: "Stop ID Required",
        description: "Please enter a valid CTA stop ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🚊 Fetching arrivals for stop:', selectedStopId.trim());
      
      const { data, error } = await supabase.functions.invoke('cta-schedule', {
        body: { stopId: selectedStopId.trim() }
      });
      
      console.log('📊 CTA arrivals response:', { data, error });
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }
      
      if (data && data.type === 'arrivals') {
        console.log('✅ Setting arrivals:', data.data);
        setArrivals(data.data || []);
        setLastUpdated(data.timestamp);
        
        if (!data.data || data.data.length === 0) {
          toast({
            title: "No arrivals found",
            description: `No upcoming trains for Stop ID: ${selectedStopId}. Check if the Stop ID is correct.`,
            variant: "default"
          });
        } else {
          toast({
            title: "✅ Arrivals Updated",
            description: `Found ${data.data.length} upcoming train${data.data.length !== 1 ? 's' : ''}`,
          });
        }
      } else {
        console.warn('⚠️ Unexpected arrivals data format:', data);
        setArrivals([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching arrivals:', error);
      
      toast({
        title: "Hold tight! We're working to get real-time data",
        description: "CTA arrivals will be available soon.",
        variant: "default",
      });
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStationSelect = (station: Station) => {
    if (station.stopId) {
      setStopId(station.stopId);
      // Automatically fetch arrivals when station is selected
      setTimeout(() => {
        fetchArrivalsForStopId(station.stopId!);
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      <CTALineStationSelector onStationSelect={handleStationSelect} />
      
      <CTAArrivals
        stopId={stopId}
        setStopId={setStopId}
        arrivals={arrivals}
        loading={loading}
        lastUpdated={lastUpdated}
        onFetchArrivals={fetchArrivals}
      />

      <CTASystemOverview
        routes={routes}
        routesLoading={routesLoading}
        onFetchRoutes={fetchRoutes}
      />

      <CTADebug
        debugMode={debugMode}
        setDebugMode={setDebugMode}
        loading={loading}
        routesLoading={routesLoading}
        routes={routes}
        arrivals={arrivals}
        stopId={stopId}
        lastUpdated={lastUpdated}
        onFetchArrivalsForStopId={fetchArrivalsForStopId}
        onFetchRoutes={fetchRoutes}
      />

      <CTAHelpSection />
    </div>
  );
};