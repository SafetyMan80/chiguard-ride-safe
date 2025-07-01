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
  { 
    name: "Red Line", 
    color: "bg-chicago-red", 
    stations: ["95th/Dan Ryan", "87th", "79th", "69th", "63rd", "55th-56th-57th", "47th", "Garfield", "35th-Bronzeville-IIT", "Cermak-Chinatown", "Roosevelt", "Harrison", "Jackson", "Monroe", "Lake", "Grand", "Chicago", "North/Clybourn", "Fullerton", "Belmont", "Addison", "Sheridan", "Wilson", "Lawrence", "Argyle", "Berwyn", "Bryn Mawr", "Thorndale", "Granville", "Loyola", "Morse", "Jarvis", "Howard"] 
  },
  { 
    name: "Blue Line", 
    color: "bg-chicago-blue", 
    stations: ["O'Hare", "Rosemont", "Cumberland", "Harwood Heights", "Norridge", "Park Ridge", "Des Plaines", "Dee Road", "Mount Prospect", "Prospect Heights", "Rosemont", "River Road", "Mannheim", "Schiller Park", "Franklin Park", "Bensenville", "Wood Dale", "Addison", "Elk Grove Village", "Higgins", "Rosemont", "Irving Park", "Montrose", "Jefferson Park", "Harlem (Forest Park)", "Oak Park", "Austin", "Cicero", "Pulaski", "Kostner", "Kedzie", "California", "Western", "Damen", "Division", "Chicago", "Grand", "Clark/Lake", "Washington", "Monroe", "Jackson", "LaSalle", "Clinton", "UIC-Halsted", "Racine", "Illinois Medical District", "Western", "Kedzie-Homan", "Pulaski", "Cicero", "Austin", "Oak Park", "Harlem", "Forest Park"] 
  },
  { 
    name: "Green Line", 
    color: "bg-green-600", 
    stations: ["Harlem/Lake", "Oak Park", "Ridgeland", "Austin", "Central", "Laramie", "Cicero", "Pulaski", "Conservatory", "Kedzie", "California", "Ashland", "Morgan", "Clinton", "Clark/Lake", "State/Lake", "Randolph/Wabash", "Madison/Wabash", "Adams/Wabash", "Roosevelt", "Cermak-McCormick Place", "35th-Bronzeville-IIT", "Indiana", "43rd", "47th", "51st", "Garfield", "King Drive", "Cottage Grove", "Halsted", "Ashland/63rd"] 
  },
  { 
    name: "Brown Line", 
    color: "bg-amber-700", 
    stations: ["Kimball", "Kedzie", "Francisco", "Rockwell", "Western", "Damen", "Montrose", "Irving Park", "Addison", "Paulina", "Southport", "Belmont", "Wellington", "Diversey", "Fullerton", "Armitage", "Sedgwick", "Chicago", "Merchandise Mart", "Clark/Lake", "State/Lake", "Randolph/Wabash", "Madison/Wabash", "Adams/Wabash", "Library", "LaSalle/Van Buren", "Quincy", "Washington/Wells", "Clark/Lake"] 
  },
  { 
    name: "Orange Line", 
    color: "bg-orange-500", 
    stations: ["Midway", "Pulaski", "Kedzie", "Western", "35th/Archer", "Ashland", "Halsted", "Roosevelt", "LaSalle/Van Buren", "Library", "Adams/Wabash", "Madison/Wabash", "Randolph/Wabash", "State/Lake", "Clark/Lake"] 
  },
  { 
    name: "Pink Line", 
    color: "bg-pink-500", 
    stations: ["54th/Cermak", "Cicero", "Kostner", "Pulaski", "Central Park", "Kedzie", "California", "Western", "Damen", "18th", "Polk", "Ashland", "Morgan", "Clinton", "Clark/Lake", "State/Lake", "Randolph/Wabash", "Madison/Wabash", "Adams/Wabash", "Library", "LaSalle/Van Buren", "Quincy", "Washington/Wells", "Clark/Lake"] 
  },
  { 
    name: "Purple Line", 
    color: "bg-purple-600", 
    stations: ["Linden", "Central", "Noyes", "Foster", "Davis", "Dempster", "Main", "South Boulevard", "Howard", "Jarvis", "Morse", "Loyola", "Granville", "Thorndale", "Bryn Mawr", "Berwyn", "Argyle", "Lawrence", "Wilson", "Sheridan", "Addison", "Belmont", "Fullerton", "Armitage", "Sedgwick", "Chicago", "Merchandise Mart", "Clark/Lake", "State/Lake", "Randolph/Wabash", "Madison/Wabash", "Adams/Wabash", "Library", "LaSalle/Van Buren", "Quincy", "Washington/Wells", "Clark/Lake"] 
  },
  { 
    name: "Yellow Line", 
    color: "bg-yellow-500", 
    stations: ["Skokie", "Oakton", "Dempster"] 
  }
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
      {/* CTA System Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-chicago-blue rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            CTA System Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {CTA_LINES.map(line => (
              <Button
                key={line.name}
                variant={selectedLine === line.name ? "chicago" : "chicago-outline"}
                size="sm"
                onClick={() => {
                  setSelectedLine(selectedLine === line.name ? "" : line.name);
                  setSelectedStation("");
                }}
                className="justify-start text-xs h-8"
              >
                <div className={`w-3 h-3 rounded-full ${line.color} mr-2`} />
                {line.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-chicago-blue" />
            Real-Time Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedLine && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-4 h-4 rounded-full ${getLineColor(selectedLine)}`} />
                <h3 className="font-semibold">{selectedLine} Stations</h3>
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-1">
                {selectedLineStations.map(station => (
                  <Button
                    key={station}
                    variant={selectedStation === station ? "chicago" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStation(selectedStation === station ? "" : station)}
                    className="w-full justify-start text-xs h-8"
                  >
                    {station}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!selectedLine && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Select a CTA line above to view stations and schedule</p>
            </div>
          )}

          {selectedLine && (
            <Button 
              variant="chicago" 
              onClick={fetchSchedule}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Loading Schedule..." : `Get ${selectedLine} Schedule`}
            </Button>
          )}

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