import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Train, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CTAMap } from "./CTAMap";

interface CTAArrival {
  staId: string;
  staNm: string;
  stpId: string;
  stpDe: string;
  rn: string;
  rt: string;
  destNm: string;
  prdt: string;
  arrT: string;
  isApp: string;
  isSch: string;
  isDly: string;
  isFlt: string;
  flags?: string;
  lat?: string;
  lon?: string;
  heading?: string;
}

interface CTARoute {
  rt: string;
  rtnm: string;
  rtclr: string;
  rtdd: string;
}

export const CTASchedule = () => {
  const [stopId, setStopId] = useState("");
  const [arrivals, setArrivals] = useState<CTAArrival[]>([]);
  const [routes, setRoutes] = useState<CTARoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setRoutesLoading(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetching CTA routes...');
      }
      
      const { data, error } = await supabase.functions.invoke('cta-schedule');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('CTA routes response:', { data, error });
      }
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Supabase function error:', error);
        }
        throw error;
      }
      
      if (data && data.type === 'routes' && Array.isArray(data.data)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Setting routes:', data.data);
        }
        setRoutes(data.data);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Unexpected routes data format:', data);
        }
        setRoutes([]);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching routes:', error);
      }
      toast({
        title: "Routes Loading Error",
        description: error.message || "Failed to load CTA routes. You can still search by stop ID.",
        variant: "destructive",
      });
      setRoutes([]);
    } finally {
      setRoutesLoading(false);
    }
  };

  const fetchArrivals = async () => {
    if (!stopId.trim()) {
      toast({
        title: "Stop ID Required",
        description: "Please enter a valid CTA stop ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetching arrivals for stop:', stopId.trim());
      }
      
      const { data, error } = await supabase.functions.invoke('cta-schedule', {
        body: { stopId: stopId.trim() }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('CTA arrivals response:', { data, error });
      }
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Supabase function error:', error);
        }
        throw error;
      }
      
      if (data && data.type === 'arrivals') {
        if (process.env.NODE_ENV === 'development') {
          console.log('Setting arrivals:', data.data);
        }
        setArrivals(data.data || []);
        setLastUpdated(data.timestamp);
        
        if (!data.data || data.data.length === 0) {
          toast({
            title: "No arrivals found",
            description: "No upcoming arrivals for this stop. Please verify the stop ID.",
          });
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Unexpected arrivals data format:', data);
        }
        setArrivals([]);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching arrivals:', error);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to fetch arrival times. Please check the stop ID and try again.",
        variant: "destructive",
      });
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  };

  const formatArrivalTime = (arrivalTime: string) => {
    const arrTime = new Date(arrivalTime);
    const now = new Date();
    const diffMinutes = Math.round((arrTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 1) return "Due";
    if (diffMinutes < 60) return `${diffMinutes} min`;
    return arrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLineColor = (route: string) => {
    const colors: { [key: string]: string } = {
      'Red': 'bg-red-500',
      'Blue': 'bg-blue-500', 
      'Brown': 'bg-amber-700',
      'Green': 'bg-green-500',
      'Orange': 'bg-orange-500',
      'Pink': 'bg-pink-500',
      'Purple': 'bg-purple-500',
      'Yellow': 'bg-yellow-500',
    };
    return colors[route] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* CTA Interactive Map */}
      <CTAMap />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Train className="w-5 h-5" />
            Real-Time CTA Schedule
          </CardTitle>
          <CardDescription>
            Enter a CTA stop ID to see live arrival times
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Stop ID (e.g., 30161)"
              value={stopId}
              onChange={(e) => setStopId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchArrivals()}
            />
            <Button 
              onClick={fetchArrivals}
              disabled={loading}
              variant="chicago"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Get Times"}
            </Button>
          </div>

          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}

          {arrivals.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Upcoming Arrivals</h3>
              {arrivals.map((arrival, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-6 rounded ${getLineColor(arrival.rt)} flex-shrink-0`} />
                      <div>
                        <div className="font-medium">{arrival.rt} Line</div>
                        <div className="text-sm text-muted-foreground">
                          to {arrival.destNm}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {arrival.staNm}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatArrivalTime(arrival.arrT)}
                      </div>
                      <Badge variant={arrival.isDly === '1' ? "destructive" : "secondary"}>
                        {arrival.isDly === '1' ? 'Delayed' : 
                         arrival.isApp === '1' ? 'Approaching' : 'On Time'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!routesLoading && routes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Available Routes</h3>
              <div className="grid grid-cols-2 gap-2">
                {routes.slice(0, 8).map((route) => (
                  <Button
                    key={route.rt}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      toast({
                        title: `${route.rtnm} Line`,
                        description: route.rtdd,
                      });
                    }}
                  >
                    <div className={`w-2 h-4 rounded mr-2 ${getLineColor(route.rtnm)}`} />
                    {route.rtnm}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {routesLoading && (
            <div className="text-center text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
              Loading routes...
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            How to Find Your Stop ID
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Look for the 5-digit number on CTA stop signs</p>
          <p>• Use the CTA app or website to find stop IDs</p>
          <p>• Popular stops: Union Station (30161), O'Hare (40890)</p>
          <p>• Millennium Station (30001), Midway (40350)</p>
        </CardContent>
      </Card>
    </div>
  );
};
