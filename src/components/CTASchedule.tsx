import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";

interface TrainArrival {
  line: string;
  destination: string;
  arrivalTime: string;
  minutes: number;
  delayed: boolean;
}

const CTA_LINES = [
  { name: "Red Line", color: "bg-chicago-red", stations: ["95th/Dan Ryan", "Fullerton", "Howard"] },
  { name: "Blue Line", color: "bg-chicago-blue", stations: ["O'Hare", "Forest Park", "UIC-Halsted"] },
  { name: "Green Line", color: "bg-green-600", stations: ["Harlem/Lake", "Cottage Grove", "Ashland/63rd"] },
  { name: "Brown Line", color: "bg-amber-700", stations: ["Kimball", "Loop", "Belmont"] },
];

export const CTASchedule = () => {
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [arrivals, setArrivals] = useState<TrainArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Mock CTA API data - in real app would use actual CTA API
  const mockArrivals: TrainArrival[] = [
    { line: "Red Line", destination: "Howard", arrivalTime: "9:15 PM", minutes: 3, delayed: false },
    { line: "Red Line", destination: "95th/Dan Ryan", arrivalTime: "9:18 PM", minutes: 6, delayed: true },
    { line: "Red Line", destination: "Howard", arrivalTime: "9:22 PM", minutes: 10, delayed: false },
    { line: "Blue Line", destination: "O'Hare", arrivalTime: "9:17 PM", minutes: 5, delayed: false },
    { line: "Blue Line", destination: "Forest Park", arrivalTime: "9:20 PM", minutes: 8, delayed: false },
  ];

  const fetchSchedule = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Filter by selected line if specified
    const filteredArrivals = selectedLine 
      ? mockArrivals.filter(arrival => arrival.line === selectedLine)
      : mockArrivals;
    
    setArrivals(filteredArrivals);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedule();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSchedule, 30000);
    return () => clearInterval(interval);
  }, [selectedLine, selectedStation]);

  const getLineColor = (lineName: string) => {
    const line = CTA_LINES.find(l => l.name === lineName);
    return line?.color || "bg-gray-500";
  };

  const selectedLineStations = CTA_LINES.find(l => l.name === selectedLine)?.stations || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-5 h-5 bg-chicago-blue rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          CTA Real-Time Schedule
        </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedLine} onValueChange={setSelectedLine}>
            <SelectTrigger>
              <SelectValue placeholder="Select CTA line" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Lines</SelectItem>
              {CTA_LINES.map(line => (
                <SelectItem key={line.name} value={line.name}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${line.color}`} />
                    {line.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedLine && (
            <Select value={selectedStation} onValueChange={setSelectedStation}>
              <SelectTrigger>
                <SelectValue placeholder="Select station" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stations</SelectItem>
                {selectedLineStations.map(station => (
                  <SelectItem key={station} value={station}>
                    {station}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button 
            variant="chicago" 
            onClick={fetchSchedule}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Updating..." : "Refresh Schedule"}
          </Button>

          {lastUpdated && (
            <p className="text-xs text-muted-foreground text-center">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Next Arrivals</h3>
        {arrivals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {loading ? "Loading schedule..." : "No trains scheduled"}
            </CardContent>
          </Card>
        ) : (
          arrivals.map((arrival, index) => (
            <Card key={index} className="animate-fade-in">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getLineColor(arrival.line)}`} />
                    <div>
                      <p className="font-medium">{arrival.line}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {arrival.destination}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant={arrival.delayed ? "destructive" : "secondary"}>
                        {arrival.minutes} min
                      </Badge>
                      {arrival.delayed && (
                        <Badge variant="outline" className="text-xs">
                          Delayed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <div className="w-3 h-3 border border-current rounded-full flex items-center justify-center text-xs">⏰</div>
                      {arrival.arrivalTime}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};