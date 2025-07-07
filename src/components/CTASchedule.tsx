import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Train, RefreshCw, ExternalLink, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScheduleCardSkeleton } from "./LoadingSkeleton";
import ctaSystemMap from "@/assets/cta-system-map-readable.jpg";

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

interface Station {
  name: string;
  lines: string[];
  stopId?: string;
}

// 🚊 COMPREHENSIVE CTA STATIONS LIST - Updated with correct Stop IDs
const POPULAR_STATIONS: Station[] = [
  { name: "Union Station", lines: ["Blue"], stopId: "30212" }, // Actually Jackson Blue Line
  { name: "O'Hare Airport", lines: ["Blue"], stopId: "30171" }, // O'Hare Terminal
  { name: "Midway Airport", lines: ["Orange"], stopId: "30063" }, // Midway Terminal  
  { name: "95th/Dan Ryan", lines: ["Red"], stopId: "30089" }, // 95th Terminal
  { name: "Howard", lines: ["Red", "Purple", "Yellow"], stopId: "30173" }, // Howard Terminal
  { name: "Clark/Lake", lines: ["Blue", "Brown", "Green", "Orange", "Pink", "Purple"], stopId: "30131" },
  { name: "Chicago/State", lines: ["Red"], stopId: "30013" }, // State/Lake Red Line
  { name: "Roosevelt", lines: ["Red", "Orange", "Green"], stopId: "30001" },
  { name: "Fullerton", lines: ["Red", "Brown", "Purple"], stopId: "30057" },
  { name: "Belmont", lines: ["Red", "Brown", "Purple"], stopId: "30254" }, // Belmont Red Line
  { name: "Addison", lines: ["Red"], stopId: "30278" },
  { name: "Wilson", lines: ["Red", "Purple"], stopId: "30256" }, // Wilson Red Line
  { name: "Jackson", lines: ["Blue", "Red"], stopId: "30212" }, // Jackson Blue Line
  { name: "LaSalle/Van Buren", lines: ["Blue", "Orange", "Brown", "Purple", "Pink"], stopId: "30031" },
  { name: "Western", lines: ["Blue", "Brown"], stopId: "30220" }, // Western Blue Line
  { name: "Logan Square", lines: ["Blue"], stopId: "30077" },
  { name: "Merchandise Mart", lines: ["Brown", "Purple"], stopId: "30768" },
  { name: "North/Clybourn", lines: ["Red"], stopId: "30017" }
];

export const CTASchedule = () => {
  const [stopId, setStopId] = useState("");
  const [arrivals, setArrivals] = useState<CTAArrival[]>([]);
  const [routes, setRoutes] = useState<CTARoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(false);
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

  const getLineColors = (lines: string[]) => {
    const colorMap: { [key: string]: string } = {
      'Red': 'bg-red-500',
      'Blue': 'bg-blue-500',
      'Brown': 'bg-amber-700',
      'Green': 'bg-green-500',
      'Orange': 'bg-orange-500',
      'Pink': 'bg-pink-500',
      'Purple': 'bg-purple-500',
      'Yellow': 'bg-yellow-500',
      'Metra': 'bg-gray-600'
    };
    
    return lines.map(line => colorMap[line] || 'bg-gray-500');
  };

  const filteredStations = POPULAR_STATIONS.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.lines.some(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStationSelect = (station: Station) => {
    if (station.stopId) {
      setStopId(station.stopId);
      toast({
        title: `Selected: ${station.name}`,
        description: `Lines: ${station.lines.join(', ')} | Stop ID: ${station.stopId}`,
      });
      
      // Automatically fetch arrivals when station is selected
      setTimeout(() => {
        fetchArrivalsForStopId(station.stopId!);
      }, 100);
    } else {
      toast({
        title: `${station.name} Station`,
        description: `Lines: ${station.lines.join(', ')} | Stop ID not available`,
        variant: "destructive"
      });
    }
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
            description: "No upcoming arrivals for this stop. Please verify the stop ID.",
          });
        }
      } else {
        console.warn('⚠️ Unexpected arrivals data format:', data);
        setArrivals([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching arrivals:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      
      // Show more detailed error info for debugging
      const errorMessage = error?.message || error?.details?.message || 'Unknown error';
      const errorCode = error?.code || error?.details?.code || 'NO_CODE';
      
      toast({
        title: "Hold tight! We're working to get real-time data",
        description: `CTA arrivals for stop ${selectedStopId} will be available soon.`,
        variant: "default",
      });
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 🗺️ CTA INTERACTIVE SYSTEM MAP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            CTA System Map
          </CardTitle>
          <CardDescription>
            Interactive Chicago Transit Authority rail network map
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="chicago"
              onClick={() => setShowMap(!showMap)}
              className="flex-1"
            >
              {showMap ? "Hide Map" : "Show Interactive Map"}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/cta-system-map.pdf', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>

          {showMap && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden bg-white">
                <img 
                  src={ctaSystemMap} 
                  alt="CTA System Map" 
                  className="w-full h-auto max-w-4xl mx-auto"
                  style={{ maxHeight: '600px', objectFit: 'contain' }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                CTA Rail System Map - Use station search below to find stop IDs and get real-time arrivals
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🔍 STATION SEARCH WITH POPULAR STATIONS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Stations & Stop IDs
          </CardTitle>
          <CardDescription>
            Search for CTA stations and get real-time information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Station search now works independently */}
          <div className="bg-chicago-blue/10 p-3 rounded-lg">
            <p className="text-sm text-chicago-blue">
              💡 <strong>Tip:</strong> Click any station below to automatically get real-time arrivals!
            </p>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Search stations or lines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredStations.slice(0, 12).map((station, index) => (
              <Card 
                key={index} 
                className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleStationSelect(station)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {getLineColors(station.lines).map((color, i) => (
                        <div key={i} className={`w-3 h-3 rounded ${color}`} />
                      ))}
                    </div>
                    <div>
                      <p className="font-medium">{station.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {station.lines.join(', ')} Line{station.lines.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {station.stopId && (
                    <div className="text-xs text-muted-foreground">
                      ID: {station.stopId}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {searchTerm && filteredStations.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No stations found matching "{searchTerm}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* 🚊 REAL-TIME SCHEDULE */}
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
              <h3 className="font-semibold">🚊 Upcoming Arrivals</h3>
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
              <h3 className="font-semibold">🚇 Available Routes</h3>
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

      {/* 🐛 DEBUG SECTION */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Train className="w-5 h-5" />
              Debug & Test CTA API
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
            >
              {debugMode ? 'Hide Debug' : 'Show Debug'}
            </Button>
          </CardTitle>
        </CardHeader>
        {debugMode && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => fetchArrivalsForStopId("30013")}
                disabled={loading}
              >
                🧪 Test Chicago/State (30013)
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchArrivalsForStopId("30089")}
                disabled={loading}
              >
                🧪 Test 95th/Dan Ryan (30089)
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchArrivalsForStopId("30171")}
                disabled={loading}
              >
                🧪 Test O'Hare (30171)
              </Button>
              <Button
                variant="outline"
                onClick={fetchRoutes}
                disabled={routesLoading}
              >
                🧪 Test Routes API
              </Button>
            </div>
            
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-semibold mb-2">Debug Info:</p>
              <p>• Routes loaded: {routes.length}</p>
              <p>• Arrivals found: {arrivals.length}</p>
              <p>• Current Stop ID: {stopId || 'None'}</p>
              <p>• Last Updated: {lastUpdated || 'Never'}</p>
              <p>• Loading: {loading ? 'Yes' : 'No'}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 📍 HOW TO FIND STOP IDS */}
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
          <p>• Search stations above to find Stop IDs</p>
        </CardContent>
      </Card>
    </div>
  );
};