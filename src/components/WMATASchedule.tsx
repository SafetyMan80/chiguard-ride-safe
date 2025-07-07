import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Loader2, RefreshCw, Train } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WMATAArrival {
  line: string;
  destination: string;
  destinationCode: string;
  arrival: string;
  cars: string;
  group: string;
}

interface WMATAStation {
  code: string;
  name: string;
  lines: string[];
  lat: number;
  lon: number;
  address: {
    Street: string;
    City: string;
    State: string;
    Zip: string;
  };
}

interface WMATALine {
  code: string;
  name: string;
  startStation: string;
  endStation: string;
  destinations: string[];
}

export const WMATASchedule = () => {
  const [selectedStation, setSelectedStation] = useState("");
  const [arrivals, setArrivals] = useState<WMATAArrival[]>([]);
  const [stations, setStations] = useState<WMATAStation[]>([]);
  const [lines, setLines] = useState<WMATALine[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch stations and lines on component mount
  useEffect(() => {
    fetchStationsAndLines();
  }, []);

  // Auto-refresh arrivals every 30 seconds when a station is selected
  useEffect(() => {
    if (!selectedStation) return;

    const interval = setInterval(() => {
      fetchArrivals();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedStation]);

  const fetchStationsAndLines = async () => {
    try {
      const [stationsResponse, linesResponse] = await Promise.all([
        supabase.functions.invoke('wmata-schedule', {
          body: { action: 'stations' }
        }),
        supabase.functions.invoke('wmata-schedule', {
          body: { action: 'lines' }
        })
      ]);

      if (stationsResponse.error) {
        throw new Error(stationsResponse.error.message);
      }
      if (linesResponse.error) {
        throw new Error(linesResponse.error.message);
      }

      setStations(stationsResponse.data?.stations || []);
      setLines(linesResponse.data?.lines || []);
    } catch (error) {
      console.error('Error fetching WMATA data:', error);
      toast({
        title: "Hold tight! We're working to get real-time data",
        description: "DC Metro information will be available soon.",
        variant: "default"
      });
    }
  };

  const fetchArrivals = async () => {
    if (!selectedStation) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('wmata-schedule', {
        body: { 
          action: 'arrivals',
          station: selectedStation 
        }
      });

      if (error) {
        throw error;
      }

      setArrivals(data?.arrivals || []);
      setLastUpdated(data?.lastUpdated || new Date().toISOString());
      
      toast({
        title: "✅ Schedule Updated",
        description: `Updated arrivals for ${stations.find(s => s.code === selectedStation)?.name}`,
      });
    } catch (error) {
      console.error('Error fetching arrivals:', error);
      toast({
        title: "Hold tight! We're working to get real-time data",
        description: "Metro arrivals will be available soon.",
        variant: "default"
      });
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStationSelect = (stationCode: string) => {
    setSelectedStation(stationCode);
    setArrivals([]);
    // Fetch arrivals immediately when station is selected
    setTimeout(() => {
      if (stationCode) {
        fetchArrivals();
      }
    }, 100);
  };

  const getLineColor = (lineCode: string) => {
    const colorMap: { [key: string]: string } = {
      'RD': 'bg-red-600',
      'BL': 'bg-blue-600', 
      'OR': 'bg-orange-500',
      'SV': 'bg-gray-400',
      'GR': 'bg-green-600',
      'YL': 'bg-yellow-500'
    };
    return colorMap[lineCode] || 'bg-gray-500';
  };

  const selectedStationInfo = stations.find(s => s.code === selectedStation);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Train className="w-5 h-5" />
            Washington D.C. Metro (WMATA)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time arrival information for DC Metro trains
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedStation} onValueChange={handleStationSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a Metro station" />
            </SelectTrigger>
            <SelectContent>
              {stations
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(station => (
                  <SelectItem key={station.code} value={station.code}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {station.name}
                      <div className="flex gap-1 ml-2">
                        {station.lines.map(line => (
                          <div 
                            key={line}
                            className={`w-2 h-2 rounded-full ${getLineColor(line)}`}
                          />
                        ))}
                      </div>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {selectedStationInfo && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-medium">{selectedStationInfo.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedStationInfo.address.Street}, {selectedStationInfo.address.City}
              </p>
              <div className="flex gap-2 mt-2">
                {selectedStationInfo.lines.map(lineCode => {
                  const line = lines.find(l => l.code === lineCode);
                  return (
                    <Badge key={lineCode} variant="secondary" className="text-xs">
                      <div className={`w-2 h-2 rounded-full ${getLineColor(lineCode)} mr-1`} />
                      {line?.name || lineCode}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>🚇 Live Data:</strong> Real-time Washington D.C. Metro arrivals and system information. 
              Connected to official WMATA API for up-to-date train schedules.
            </p>
          </div>
          
          {/* DC Metro Tips */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">🏛️ DC Metro Tips</h4>
            <ul className="text-sm space-y-1 text-blue-700">
              <li>• SmarTrip card required for all rides</li>
              <li>• Fares vary by distance and time of day</li>
              <li>• Stand right on escalators (seriously enforced!)</li>
              <li>• No eating/drinking on trains or platforms</li>
              <li>• Free transfers between bus and rail within 2 hours</li>
              <li>• Use Mobile SmarTrip app for convenience</li>
            </ul>
          </div>

          {selectedStation && (
            <Button 
              onClick={fetchArrivals} 
              disabled={loading}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Arrivals
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Arrivals */}
      {selectedStation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Live Arrivals
              {lastUpdated && (
                <span className="text-sm font-normal text-muted-foreground">
                  • Updated {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && arrivals.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading arrivals...</span>
              </div>
            ) : arrivals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {selectedStation ? "No upcoming arrivals" : "Select a station to view arrivals"}
              </div>
            ) : (
              <div className="space-y-3">
                {arrivals.map((arrival, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getLineColor(arrival.line)}`} />
                      <div>
                        <div className="font-medium">
                          {arrival.destination}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {arrival.line} Line • Platform {arrival.group}
                          {arrival.cars && ` • ${arrival.cars}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        arrival.arrival === 'Arriving' || arrival.arrival === 'Boarding'
                          ? 'text-green-600' 
                          : 'text-foreground'
                      }`}>
                        {arrival.arrival}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lines Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Metro Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lines.map(line => (
              <div key={line.code} className="flex items-center gap-3 p-2 border rounded">
                <div className={`w-4 h-4 rounded-full ${getLineColor(line.code)}`} />
                <div>
                  <div className="font-medium">{line.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {line.destinations.join(' ↔ ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};