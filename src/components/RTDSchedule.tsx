import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Loader2, RefreshCw, Train, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RTDArrival {
  line: string;
  destination: string;
  arrival: string;
  direction: string;
}

export const RTDSchedule = () => {
  const [selectedStation, setSelectedStation] = useState("");
  const [arrivals, setArrivals] = useState<RTDArrival[]>([]);
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
      const { data, error } = await supabase.functions.invoke('rtd-schedule', {
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
      console.error('Error fetching RTD arrivals:', error);
      toast({
        title: "Failed to fetch arrivals",
        description: "Please check if the RTD API is configured correctly.",
        variant: "destructive"
      });
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  };

  const getLineColor = (lineCode: string) => {
    const colorMap: { [key: string]: string } = {
      'A': 'bg-green-600',
      'B': 'bg-blue-600',
      'C': 'bg-orange-600',
      'D': 'bg-yellow-600',
      'E': 'bg-purple-600',
      'F': 'bg-red-600',
      'G': 'bg-teal-600',
      'H': 'bg-pink-600',
      'N': 'bg-cyan-600',
      'R': 'bg-indigo-600',
      'W': 'bg-amber-600'
    };
    return colorMap[lineCode] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Train className="w-5 h-5" />
            Denver RTD Light Rail & Commuter Rail
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time arrival information for RTD trains
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter station name (e.g., Union Station, Airport)"
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
                          {arrival.line} Line • {arrival.direction}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        arrival.arrival === 'Arriving' || arrival.arrival === 'Due'
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
          <CardTitle>RTD Rail Lines</CardTitle>
          <p className="text-sm text-muted-foreground">
            Denver's Light Rail and Commuter Rail system
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { code: 'A', name: 'A Line', desc: 'Airport to Union Station' },
              { code: 'B', name: 'B Line', desc: 'Westminster to Union Station' },
              { code: 'C', name: 'C Line', desc: 'Littleton to Union Station' },
              { code: 'D', name: 'D Line', desc: '18th & California to Littleton' },
              { code: 'E', name: 'E Line', desc: 'Union Station to Ridgegate' },
              { code: 'F', name: 'F Line', desc: '18th & California to Ridgegate' },
              { code: 'G', name: 'G Line', desc: 'Wheat Ridge to Union Station' },
              { code: 'H', name: 'H Line', desc: '18th & California to Eastlake' },
              { code: 'N', name: 'N Line', desc: 'Eastlake to Thornton' },
              { code: 'R', name: 'R Line', desc: 'Littleton to 9th & Colorado' },
              { code: 'W', name: 'W Line', desc: 'Union Station to 13th & Federal' }
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
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> RTD provides GTFS and GTFS-RT data feeds. 
              Real-time arrivals require RTD API configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};