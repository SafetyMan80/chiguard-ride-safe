import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Loader2, RefreshCw, Train, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SEPTAArrival {
  line: string;
  destination: string;
  arrival: string;
  direction: string;
  track?: string;
  status: string;
  delay: string;
}

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

  const getLineColor = (lineCode: string) => {
    const colorMap: { [key: string]: string } = {
      'BSL': 'bg-orange-500', // Broad Street Line
      'MFL': 'bg-blue-600', // Market-Frankford Line
      'NHSL': 'bg-purple-600', // Norristown High Speed Line
      'RRD': 'bg-purple-700', // Regional Rail
      'Airport': 'bg-blue-500',
      'West Trenton': 'bg-green-600',
      'Warminster': 'bg-yellow-600',
      'Lansdale/Doylestown': 'bg-red-600',
      'Paoli/Thorndale': 'bg-indigo-600',
      'Media/Elwyn': 'bg-pink-600',
      'Wilmington/Newark': 'bg-teal-600',
      'Chestnut Hill East': 'bg-amber-600',
      'Chestnut Hill West': 'bg-lime-600',
      'Cynwyd': 'bg-rose-600',
      'Fox Chase': 'bg-emerald-600',
      'Manayunk/Norristown': 'bg-violet-600'
    };
    return colorMap[lineCode] || 'bg-gray-500';
  };

  const popularStations = [
    "30th Street Station",
    "Jefferson Station", 
    "City Hall",
    "Temple University",
    "Airport Terminal A",
    "15th Street",
    "Suburban Station",
    "North Philadelphia"
  ];

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
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter station name (e.g., 30th Street Station, City Hall)"
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchArrivals()}
              />
            </div>
            <Button 
              onClick={fetchArrivals} 
              disabled={loading || !selectedStation.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Popular Stations */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Popular Stations:</p>
            <div className="flex flex-wrap gap-2">
              {popularStations.map((station) => (
                <Button
                  key={station}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStation(station)}
                  className="text-xs"
                >
                  {station}
                </Button>
              ))}
            </div>
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
                {selectedStation ? "No upcoming arrivals found" : "Enter a station name to view arrivals"}
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
                          {arrival.line} • {arrival.direction}
                          {arrival.track && ` • Track ${arrival.track}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`font-bold ${
                        arrival.status === 'On Time' 
                          ? 'text-green-600' 
                          : arrival.status === 'Delayed'
                          ? 'text-red-600'
                          : 'text-foreground'
                      }`}>
                        {arrival.arrival}
                      </div>
                      {arrival.status !== 'On Time' && (
                        <Badge variant={arrival.status === 'Delayed' ? 'destructive' : 'secondary'} className="text-xs">
                          {arrival.status}
                        </Badge>
                      )}
                      {arrival.delay !== '0' && (
                        <div className="text-xs text-red-600">
                          +{arrival.delay} min
                        </div>
                      )}
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
          <CardTitle>SEPTA Rail Lines</CardTitle>
          <p className="text-sm text-muted-foreground">
            Philadelphia's subway, elevated, and regional rail system
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { code: 'MFL', name: 'Market-Frankford Line', desc: 'East-West subway/elevated' },
              { code: 'BSL', name: 'Broad Street Line', desc: 'North-South subway' },
              { code: 'NHSL', name: 'Norristown High Speed Line', desc: 'Light rail to suburbs' },
              { code: 'RRD', name: 'Regional Rail', desc: 'Commuter rail network' },
              { code: 'Airport', name: 'Airport Line', desc: 'To Philadelphia International' },
              { code: 'Paoli/Thorndale', name: 'Paoli/Thorndale Line', desc: 'Western suburbs' },
              { code: 'Media/Elwyn', name: 'Media/Elwyn Line', desc: 'Southwestern suburbs' },
              { code: 'West Trenton', name: 'West Trenton Line', desc: 'Northern New Jersey' }
            ].map(line => (
              <div key={line.code} className="flex items-center gap-3 p-2 border rounded">
                <div className={`w-4 h-4 rounded-full ${getLineColor(line.code)}`} />
                <div>
                  <div className="font-medium">{line.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {line.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Notice */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Data Source:</strong> SEPTA provides real-time arrival data through their public API. 
              Station names should match SEPTA's official station names for best results.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};