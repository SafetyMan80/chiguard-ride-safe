import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Train, RefreshCw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MTAArrival {
  station_id: string;
  station_name: string;
  route_id: string;
  route_name: string;
  direction: string;
  arrival_time: string;
  departure_time: string;
  delay: number;
  headsign: string;
}

interface MTALine {
  name: string;
  color: string;
}

// Popular NYC Subway stations
const POPULAR_STATIONS = [
  { name: "Times Square-42nd St", lines: ["4", "5", "6", "7", "N", "Q", "R", "W"], stationId: "127" },
  { name: "Union Square-14th St", lines: ["4", "5", "6", "L", "N", "Q", "R", "W"], stationId: "635" },
  { name: "Grand Central-42nd St", lines: ["4", "5", "6", "7"], stationId: "631" },
  { name: "34th St-Herald Sq", lines: ["B", "D", "F", "M", "N", "Q", "R", "W"], stationId: "120" },
  { name: "14th St-Union Sq", lines: ["4", "5", "6", "L"], stationId: "635" },
  { name: "59th St-Columbus Circle", lines: ["A", "B", "C", "D"], stationId: "309" },
  { name: "Atlantic Ave-Barclays Ctr", lines: ["B", "D", "N", "Q", "R", "W"], stationId: "238" },
  { name: "96th St", lines: ["6"], stationId: "621" },
  { name: "Canal St", lines: ["4", "5", "6"], stationId: "629" },
  { name: "42nd St-Port Authority", lines: ["A", "C", "E"], stationId: "357" }
];

export const MTASchedule = () => {
  const [stationId, setStationId] = useState("");
  const [arrivals, setArrivals] = useState<MTAArrival[]>([]);
  const [lines, setLines] = useState<MTALine[]>([]);
  const [loading, setLoading] = useState(false);
  const [linesLoading, setLinesLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchLines();
  }, []);

  const fetchLines = async () => {
    try {
      setLinesLoading(true);
      console.log('🚇 Fetching MTA lines...');
      
      const { data, error } = await supabase.functions.invoke('mta-schedule');
      
      console.log('📊 MTA lines response:', { data, error });
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }
      
      if (data && data.type === 'lines' && Array.isArray(data.data)) {
        console.log('✅ Setting lines:', data.data);
        setLines(data.data);
      } else {
        console.warn('⚠️ Unexpected lines data format:', data);
        setLines([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching lines:', error);
      toast({
        title: "Failed to load MTA lines",
        description: "Could not load subway line information.",
        variant: "destructive",
      });
      setLines([]);
    } finally {
      setLinesLoading(false);
    }
  };

  const fetchArrivals = async () => {
    await fetchArrivalsForStation(stationId);
  };

  const formatArrivalTime = (arrivalTime: string) => {
    const arrTime = new Date(arrivalTime);
    const now = new Date();
    const diffMinutes = Math.round((arrTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 1) return "Arriving";
    if (diffMinutes < 60) return `${diffMinutes} min`;
    return arrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLineColor = (route: string) => {
    const colors: { [key: string]: string } = {
      '1': 'bg-red-600', '2': 'bg-red-600', '3': 'bg-red-600',
      '4': 'bg-green-600', '5': 'bg-green-600', '6': 'bg-green-600',
      '7': 'bg-purple-600',
      'A': 'bg-blue-600', 'C': 'bg-blue-600', 'E': 'bg-blue-600',
      'B': 'bg-orange-500', 'D': 'bg-orange-500', 'F': 'bg-orange-500', 'M': 'bg-orange-500',
      'G': 'bg-green-500',
      'J': 'bg-amber-700', 'Z': 'bg-amber-700',
      'L': 'bg-gray-500',
      'N': 'bg-yellow-500', 'Q': 'bg-yellow-500', 'R': 'bg-yellow-500', 'W': 'bg-yellow-500',
    };
    return colors[route] || 'bg-gray-500';
  };

  const filteredStations = POPULAR_STATIONS.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.lines.some(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStationSelect = (station: typeof POPULAR_STATIONS[0]) => {
    setStationId(station.stationId);
    toast({
      title: `Selected: ${station.name}`,
      description: `Lines: ${station.lines.join(', ')} | Station ID: ${station.stationId}`,
    });
    
    // Automatically fetch arrivals when station is selected
    setTimeout(() => {
      fetchArrivalsForStation(station.stationId);
    }, 100);
  };

  const fetchArrivalsForStation = async (selectedStationId: string) => {
    if (!selectedStationId.trim()) {
      toast({
        title: "Station ID Required",
        description: "Please enter a valid NYC subway station ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🚇 Fetching arrivals for station:', selectedStationId.trim());
      
      const { data, error } = await supabase.functions.invoke('mta-schedule', {
        body: { stationId: selectedStationId.trim() }
      });
      
      console.log('📊 MTA arrivals response:', { data, error });
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }
      
      if (data && data.type === 'arrivals') {
        console.log('✅ Setting arrivals:', data.data);
        setArrivals(data.data || []);
        setLastUpdated(data.timestamp);
        
        if (data.notice) {
          toast({
            title: "Live MTA Data",
            description: data.notice,
          });
        }
        
        if (!data.data || data.data.length === 0) {
          toast({
            title: "No arrivals found",
            description: "No upcoming arrivals for this station at this time.",
          });
        }
      } else {
        console.warn('⚠️ Unexpected arrivals data format:', data);
        setArrivals([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching arrivals:', error);
      
      toast({
        title: "MTA Schedule Error",
        description: "Unable to fetch live data at this time. Please try again.",
        variant: "destructive",
      });
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* NYC Subway System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            NYC Subway System
          </CardTitle>
          <CardDescription>
            New York City Metropolitan Transportation Authority (MTA) subway network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>🚇 Live Data:</strong> Real-time NYC MTA subway arrivals and system information. 
              Connected to official MTA GTFS-RT feeds for up-to-date train schedules.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Station Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find NYC Subway Stations
          </CardTitle>
          <CardDescription>
            Search for popular NYC subway stations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    <div className="flex flex-wrap gap-1">
                      {station.lines.slice(0, 4).map((line, i) => (
                        <div key={i} className={`w-6 h-4 rounded text-white text-xs flex items-center justify-center font-bold ${getLineColor(line)}`}>
                          {line}
                        </div>
                      ))}
                      {station.lines.length > 4 && (
                        <span className="text-xs text-muted-foreground">+{station.lines.length - 4}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{station.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Lines: {station.lines.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {station.stationId}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Train className="w-5 h-5" />
            NYC Subway Arrivals
          </CardTitle>
          <CardDescription>
            Enter a station ID to see real-time upcoming trains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Station ID (e.g., 127)"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchArrivals()}
            />
            <Button 
              onClick={fetchArrivals}
              disabled={loading}
              variant="default"
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
              <h3 className="font-semibold">🚇 Upcoming Trains</h3>
              {arrivals.map((arrival, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-6 rounded text-white text-sm flex items-center justify-center font-bold ${getLineColor(arrival.route_name)}`}>
                        {arrival.route_name}
                      </div>
                      <div>
                        <div className="font-medium">{arrival.route_name} Line</div>
                        <div className="text-sm text-muted-foreground">
                          to {arrival.headsign} ({arrival.direction})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {arrival.station_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatArrivalTime(arrival.arrival_time)}
                      </div>
                      <Badge variant={arrival.delay > 60 ? "destructive" : "secondary"}>
                        {arrival.delay > 60 ? `${Math.round(arrival.delay / 60)}min delay` : 'On Time'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};