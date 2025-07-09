import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CTAArrival {
  line: string;
  station: string;
  destination: string;
  direction: string;
  arrivalTime: string;
  trainId: string;
  status: string;
}

interface CTAResponse {
  success: boolean;
  data: CTAArrival[];
  error?: string;
  timestamp: string;
  source: string;
}

export const CTASchedule = () => {
  const [arrivals, setArrivals] = useState<CTAArrival[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllArrivals();
  }, []);

  const fetchAllArrivals = async () => {
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
      console.log('🚆 CTA Schedule: Starting fetch...');
      
      // Make a single call to the edge function without any station parameter
      // Let the edge function handle fetching from multiple stations
      const { data, error } = await supabase.functions.invoke('cta-schedule', {
        body: {} // Empty body - let function use its default behavior
      });

      console.log('🚆 CTA Schedule: Response received', { 
        data: data ? 'present' : 'missing', 
        error: error ? error.message : 'none',
        dataLength: data?.data?.length || 0
      });

      if (error) {
        console.error('🚆 CTA Schedule: Supabase function error:', error);
        throw new Error(error.message || 'Failed to fetch CTA data');
      }

      if (!data?.success) {
        console.error('🚆 CTA Schedule: Function returned unsuccessful:', data);
        throw new Error(data?.error || 'CTA API returned unsuccessful response');
      }

      if (!data?.data || data.data.length === 0) {
        console.warn('🚆 CTA Schedule: No arrivals found in response');
        setArrivals([]);
        toast({
          title: "No Active Trains",
          description: "No CTA trains currently active. Try again in a few minutes.",
          duration: 3000
        });
        return;
      }

      const allArrivals = data.data;

      // Remove duplicates based on train ID and arrival time
      const uniqueArrivals = allArrivals.filter((arrival, index, self) => 
        index === self.findIndex(a => 
          a.trainId === arrival.trainId && 
          a.arrivalTime === arrival.arrivalTime &&
          a.station === arrival.station
        )
      );

      // Sort by arrival time (earliest first)
      const sortedArrivals = uniqueArrivals.sort((a, b) => {
        if (a.arrivalTime === 'Approaching' || a.arrivalTime === 'Boarding') return -1;
        if (b.arrivalTime === 'Approaching' || b.arrivalTime === 'Boarding') return 1;
        const aMinutes = parseInt(a.arrivalTime.replace(' min', '')) || 999;
        const bMinutes = parseInt(b.arrivalTime.replace(' min', '')) || 999;
        return aMinutes - bMinutes;
      });

      setArrivals(sortedArrivals);
      
      // Format timestamp with Central Time
      const now = new Date();
      const centralTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        hour: '2-digit',
        minute: '2-digit', 
        second: '2-digit'
      }).format(now);
      setLastUpdated(centralTime);
      
      toast({
        title: "CTA Schedule Updated",
        description: `Found ${sortedArrivals.length} active trains at ${centralTime} CT`,
        duration: 2000
      });
      
    } catch (error) {
      console.error('Error fetching CTA arrivals:', error);
      setArrivals([]);
      
      toast({
        title: "CTA Service Issue",
        description: `Error: ${error?.message || 'Unknown error'}. Please try again.`,
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const getLineColor = (line: string) => {
    const colors: { [key: string]: string } = {
      'Red': 'bg-red-600',
      'Blue': 'bg-blue-600',
      'Brown': 'bg-amber-700',
      'Green': 'bg-green-600',
      'Orange': 'bg-orange-500',
      'Purple': 'bg-purple-600',
      'Pink': 'bg-pink-500',
      'Yellow': 'bg-yellow-500'
    };
    return colors[line] || 'bg-gray-500';
  };

  const formatArrivalTime = (arrivalTime: string) => {
    if (arrivalTime === "Boarding" || arrivalTime === "Arrived" || arrivalTime === "Approaching") {
      return arrivalTime;
    }
    return arrivalTime;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">Chicago CTA - All Active Trains</CardTitle>
          <Button 
            onClick={fetchAllArrivals} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Clock className="w-4 h-4" />
              Last updated: {lastUpdated} CT
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Loading all CTA train arrivals...</p>
            </div>
          ) : arrivals.length > 0 ? (
            <div className="space-y-3">
              {arrivals.map((arrival, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getLineColor(arrival.line)} text-white`}>
                      {arrival.line}
                    </Badge>
                    <div>
                      <div className="font-semibold">{arrival.station}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        to {arrival.destination}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatArrivalTime(arrival.arrivalTime)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {arrival.direction} • #{arrival.trainId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active trains found</p>
              <p className="text-sm">Try refreshing or check back later</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};