import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Train, MapPin, Wifi, WifiOff } from "lucide-react";

interface MARTAArrival {
  line: string;
  station: string;
  destination: string;
  direction: string;
  arrivalTime: string;
  eventTime: string;
  delay: string;
  trainId: string;
  status: string;
}

interface MARTAResponse {
  success: boolean;
  data: MARTAArrival[];
  error?: string;
  timestamp: string;
  source: string;
}

export const MARTASchedule = () => {
  const [arrivals, setArrivals] = useState<MARTAArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // MARTA Rail Lines
  const martaLines = [
    { id: "all", name: "All Lines", color: "bg-gray-500" },
    { id: "red", name: "Red Line", color: "bg-red-500" },
    { id: "gold", name: "Gold Line", color: "bg-yellow-500" },
    { id: "blue", name: "Blue Line", color: "bg-blue-500" },
    { id: "green", name: "Green Line", color: "bg-green-500" }
  ];

  // Major MARTA Stations
  const martaStations = [
    "All Stations",
    "Airport",
    "College Park",
    "East Point",
    "Lakewood/Ft. McPherson",
    "Oakland City",
    "West End",
    "Garnett",
    "Five Points",
    "Peachtree Center",
    "Civic Center",
    "North Avenue",
    "Midtown",
    "Arts Center",
    "Lindbergh Center",
    "Buckhead",
    "Medical Center",
    "Dunwoody",
    "Sandy Springs",
    "North Springs",
    "Doraville",
    "Chamblee",
    "Brookhaven/Oglethorpe",
    "Lenox",
    "Edgewood/Candler Park",
    "Inman Park/Reynoldstown",
    "King Memorial",
    "Georgia State",
    "Omni Dome",
    "Vine City",
    "Ashby",
    "Bankhead",
    "Hamilton E. Holmes",
    "West Lake",
    "Hightower",
    "Indian Creek",
    "Kensington",
    "Avondale",
    "Decatur",
    "East Lake"
  ];

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const fetchArrivals = async () => {
    if (!isOnline) {
      toast({
        title: "No Internet Connection",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const requestBody: any = {};
      if (selectedLine !== "all") requestBody.line = selectedLine;
      if (selectedStation !== "all") requestBody.station = selectedStation;
      
      const { data, error } = await supabase.functions.invoke('marta-schedule', {
        method: 'POST',
        body: Object.keys(requestBody).length > 0 ? requestBody : undefined
      });

      if (error) throw error;

      const response: MARTAResponse = data;
      if (response.success) {
        setArrivals(response.data || []);
        setLastUpdated(new Date().toLocaleTimeString());
        toast({
          title: "Schedule Updated",
          description: `Found ${response.data?.length || 0} upcoming arrivals`
        });
      } else {
        throw new Error(response.error || 'Failed to fetch MARTA data');
      }
    } catch (error) {
      console.error('Error fetching MARTA arrivals:', error);
      
      const errorMessage = error.message || 'Unknown error';
      let userMessage = "Failed to fetch MARTA schedule. Please try again.";
      
      // Check if it's a MARTA API server error
      if (errorMessage.includes('502') || errorMessage.includes('gateway')) {
        userMessage = "MARTA's servers are currently experiencing issues. Please try again later.";
      } else if (errorMessage.includes('MARTA API key')) {
        userMessage = "MARTA service is not properly configured.";
      }
      
      toast({
        title: "MARTA Schedule Unavailable",
        description: userMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getLineColor = (line: string) => {
    const lineData = martaLines.find(l => l.name.toLowerCase().includes(line.toLowerCase()));
    return lineData?.color || "bg-gray-500";
  };

  const formatArrivalTime = (arrivalTime: string) => {
    if (arrivalTime === "Boarding" || arrivalTime === "Arrived") {
      return arrivalTime;
    }
    // If it's a number, it's minutes
    const minutes = parseInt(arrivalTime);
    if (!isNaN(minutes)) {
      return minutes <= 1 ? "Arriving" : `${minutes} min`;
    }
    return arrivalTime;
  };

  useEffect(() => {
    fetchArrivals();
    const interval = setInterval(fetchArrivals, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedLine, selectedStation]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Train className="w-5 h-5" />
              MARTA Rail Schedule
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isOnline ? (
                <><Wifi className="w-4 h-4" /> Online</>
              ) : (
                <><WifiOff className="w-4 h-4" /> Offline</>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedLine} onValueChange={setSelectedLine}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Line" />
              </SelectTrigger>
              <SelectContent>
                {martaLines.map((line) => (
                  <SelectItem key={line.id} value={line.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${line.color}`} />
                      {line.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStation} onValueChange={setSelectedStation}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Station" />
              </SelectTrigger>
              <SelectContent>
                {martaStations.map((station, index) => (
                  <SelectItem key={index} value={index === 0 ? "all" : station.toLowerCase()}>
                    {station}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <Button 
              onClick={fetchArrivals} 
              disabled={loading || !isOnline}
              variant="chicago"
            >
              {loading ? "Updating..." : "Refresh Schedule"}
            </Button>
            {lastUpdated && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Last updated: {lastUpdated}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {arrivals.length > 0 ? (
        <div className="space-y-3">
          {arrivals.slice(0, 10).map((arrival, index) => (
            <Card key={index} className="animate-fade-in">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getLineColor(arrival.line)}`} />
                    <div>
                      <div className="font-semibold">{arrival.line} Line</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {arrival.station}
                      </div>
                      <div className="text-sm">
                        To {arrival.destination} ({arrival.direction})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        arrival.arrivalTime === "Boarding" ? "destructive" :
                        arrival.arrivalTime === "Arrived" ? "secondary" :
                        "default"
                      }
                      className="text-lg font-bold"
                    >
                      {formatArrivalTime(arrival.arrivalTime)}
                    </Badge>
                    {arrival.delay !== "0" && (
                      <div className="text-xs text-red-500 mt-1">
                        Delayed {arrival.delay} min
                      </div>
                    )}
                    {arrival.trainId && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Train #{arrival.trainId}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {loading ? (
              <div>Loading MARTA schedule...</div>
            ) : arrivals.length === 0 ? (
              <div>No upcoming arrivals found. Try adjusting your filters or check back later.</div>
            ) : (
              <div>Unable to load schedule data.</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};