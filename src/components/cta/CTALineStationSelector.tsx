import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Train, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Station {
  name: string;
  stopId: string;
  lines: string[];
}

interface CTALineStationSelectorProps {
  onStationSelect: (station: Station) => void;
}

// CTA Lines with their stations and stop IDs
const CTA_LINES_STATIONS = {
  "Red": [
    { name: "Howard", stopId: "30173", lines: ["Red"] },
    { name: "Jarvis", stopId: "30251", lines: ["Red"] },
    { name: "Morse", stopId: "30252", lines: ["Red"] },
    { name: "Loyola", stopId: "30253", lines: ["Red"] },
    { name: "Granville", stopId: "30254", lines: ["Red"] },
    { name: "Thorndale", stopId: "30255", lines: ["Red"] },
    { name: "Bryn Mawr", stopId: "30256", lines: ["Red"] },
    { name: "Berwyn", stopId: "30257", lines: ["Red"] },
    { name: "Argyle", stopId: "30258", lines: ["Red"] },
    { name: "Lawrence", stopId: "30259", lines: ["Red"] },
    { name: "Wilson", stopId: "30256", lines: ["Red"] },
    { name: "Sheridan", stopId: "30021", lines: ["Red"] },
    { name: "Addison", stopId: "30278", lines: ["Red"] },
    { name: "Belmont", stopId: "30254", lines: ["Red"] },
    { name: "Fullerton", stopId: "30057", lines: ["Red"] },
    { name: "North/Clybourn", stopId: "30017", lines: ["Red"] },
    { name: "Clark/Division", stopId: "30018", lines: ["Red"] },
    { name: "Chicago/State", stopId: "30013", lines: ["Red"] },
    { name: "Grand/State", stopId: "30014", lines: ["Red"] },
    { name: "Lake/State", stopId: "30015", lines: ["Red"] },
    { name: "Monroe/State", stopId: "30016", lines: ["Red"] },
    { name: "Jackson/State", stopId: "30001", lines: ["Red"] },
    { name: "Harrison", stopId: "30002", lines: ["Red"] },
    { name: "Roosevelt", stopId: "30001", lines: ["Red"] },
    { name: "Cermak-Chinatown", stopId: "30003", lines: ["Red"] },
    { name: "Sox-35th", stopId: "30004", lines: ["Red"] },
    { name: "47th", stopId: "30005", lines: ["Red"] },
    { name: "Garfield", stopId: "30006", lines: ["Red"] },
    { name: "63rd", stopId: "30007", lines: ["Red"] },
    { name: "69th", stopId: "30008", lines: ["Red"] },
    { name: "79th", stopId: "30009", lines: ["Red"] },
    { name: "87th", stopId: "30010", lines: ["Red"] },
    { name: "95th/Dan Ryan", stopId: "30089", lines: ["Red"] }
  ],
  "Blue": [
    { name: "O'Hare", stopId: "30171", lines: ["Blue"] },
    { name: "Rosemont", stopId: "30172", lines: ["Blue"] },
    { name: "Cumberland", stopId: "30070", lines: ["Blue"] },
    { name: "Harlem (O'Hare)", stopId: "30071", lines: ["Blue"] },
    { name: "Jefferson Park", stopId: "30077", lines: ["Blue"] },
    { name: "Montrose", stopId: "30078", lines: ["Blue"] },
    { name: "Irving Park", stopId: "30079", lines: ["Blue"] },
    { name: "Addison", stopId: "30080", lines: ["Blue"] },
    { name: "Belmont", stopId: "30081", lines: ["Blue"] },
    { name: "Logan Square", stopId: "30077", lines: ["Blue"] },
    { name: "California", stopId: "30082", lines: ["Blue"] },
    { name: "Western", stopId: "30220", lines: ["Blue"] },
    { name: "Damen", stopId: "30083", lines: ["Blue"] },
    { name: "Division", stopId: "30084", lines: ["Blue"] },
    { name: "Chicago", stopId: "30085", lines: ["Blue"] },
    { name: "Grand", stopId: "30086", lines: ["Blue"] },
    { name: "Clark/Lake", stopId: "30131", lines: ["Blue"] },
    { name: "Washington", stopId: "30087", lines: ["Blue"] },
    { name: "Monroe", stopId: "30088", lines: ["Blue"] },
    { name: "Jackson", stopId: "30212", lines: ["Blue"] },
    { name: "LaSalle", stopId: "30031", lines: ["Blue"] },
    { name: "Clinton", stopId: "30089", lines: ["Blue"] },
    { name: "UIC-Halsted", stopId: "30090", lines: ["Blue"] },
    { name: "Racine", stopId: "30091", lines: ["Blue"] },
    { name: "Illinois Medical District", stopId: "30092", lines: ["Blue"] },
    { name: "Western (Forest Park)", stopId: "30093", lines: ["Blue"] },
    { name: "Kedzie-Homan", stopId: "30094", lines: ["Blue"] },
    { name: "Pulaski", stopId: "30095", lines: ["Blue"] },
    { name: "Cicero", stopId: "30096", lines: ["Blue"] },
    { name: "Austin", stopId: "30097", lines: ["Blue"] },
    { name: "Oak Park", stopId: "30098", lines: ["Blue"] },
    { name: "Harlem (Forest Park)", stopId: "30099", lines: ["Blue"] },
    { name: "Forest Park", stopId: "30045", lines: ["Blue"] }
  ],
  "Brown": [
    { name: "Kimball", stopId: "30768", lines: ["Brown"] },
    { name: "Kedzie", stopId: "30142", lines: ["Brown"] },
    { name: "Francisco", stopId: "30143", lines: ["Brown"] },
    { name: "Rockwell", stopId: "30144", lines: ["Brown"] },
    { name: "Western", stopId: "30145", lines: ["Brown"] },
    { name: "Damen", stopId: "30146", lines: ["Brown"] },
    { name: "Montrose", stopId: "30147", lines: ["Brown"] },
    { name: "Irving Park", stopId: "30148", lines: ["Brown"] },
    { name: "Addison", stopId: "30149", lines: ["Brown"] },
    { name: "Paulina", stopId: "30150", lines: ["Brown"] },
    { name: "Southport", stopId: "30151", lines: ["Brown"] },
    { name: "Belmont", stopId: "30152", lines: ["Brown"] },
    { name: "Wellington", stopId: "30153", lines: ["Brown"] },
    { name: "Diversey", stopId: "30154", lines: ["Brown"] },
    { name: "Fullerton", stopId: "30155", lines: ["Brown"] },
    { name: "Armitage", stopId: "30156", lines: ["Brown"] },
    { name: "Sedgwick", stopId: "30157", lines: ["Brown"] },
    { name: "Chicago", stopId: "30158", lines: ["Brown"] },
    { name: "Merchandise Mart", stopId: "30768", lines: ["Brown"] },
    { name: "Clark/Lake", stopId: "30131", lines: ["Brown"] },
    { name: "State/Lake", stopId: "30015", lines: ["Brown"] },
    { name: "Washington/Wells", stopId: "30159", lines: ["Brown"] },
    { name: "Quincy/Wells", stopId: "30160", lines: ["Brown"] },
    { name: "LaSalle/Van Buren", stopId: "30031", lines: ["Brown"] },
    { name: "Harold Washington Library", stopId: "30161", lines: ["Brown"] }
  ],
  "Green": [
    { name: "Harlem/Lake", stopId: "30162", lines: ["Green"] },
    { name: "Oak Park", stopId: "30163", lines: ["Green"] },
    { name: "Ridgeland", stopId: "30164", lines: ["Green"] },
    { name: "Austin", stopId: "30165", lines: ["Green"] },
    { name: "Central", stopId: "30166", lines: ["Green"] },
    { name: "Laramie", stopId: "30167", lines: ["Green"] },
    { name: "Cicero", stopId: "30168", lines: ["Green"] },
    { name: "Pulaski", stopId: "30169", lines: ["Green"] },
    { name: "Conservatory", stopId: "30170", lines: ["Green"] },
    { name: "Kedzie", stopId: "30171", lines: ["Green"] },
    { name: "California", stopId: "30172", lines: ["Green"] },
    { name: "Ashland/63rd", stopId: "30173", lines: ["Green"] },
    { name: "Halsted", stopId: "30174", lines: ["Green"] },
    { name: "Indiana", stopId: "30175", lines: ["Green"] },
    { name: "35th-Bronzeville-IIT", stopId: "30176", lines: ["Green"] },
    { name: "Roosevelt", stopId: "30001", lines: ["Green"] },
    { name: "Cermak-McCormick Place", stopId: "30177", lines: ["Green"] },
    { name: "Clark/Lake", stopId: "30131", lines: ["Green"] }
  ],
  "Orange": [
    { name: "Midway", stopId: "30063", lines: ["Orange"] },
    { name: "Pulaski", stopId: "30178", lines: ["Orange"] },
    { name: "Kedzie", stopId: "30179", lines: ["Orange"] },
    { name: "Western", stopId: "30180", lines: ["Orange"] },
    { name: "35th/Archer", stopId: "30181", lines: ["Orange"] },
    { name: "Ashland", stopId: "30182", lines: ["Orange"] },
    { name: "Halsted", stopId: "30183", lines: ["Orange"] },
    { name: "Roosevelt", stopId: "30001", lines: ["Orange"] },
    { name: "Harold Washington Library", stopId: "30184", lines: ["Orange"] },
    { name: "LaSalle/Van Buren", stopId: "30031", lines: ["Orange"] },
    { name: "Quincy/Wells", stopId: "30185", lines: ["Orange"] },
    { name: "Washington/Wells", stopId: "30186", lines: ["Orange"] },
    { name: "Clark/Lake", stopId: "30131", lines: ["Orange"] }
  ],
  "Pink": [
    { name: "54th/Cermak", stopId: "30187", lines: ["Pink"] },
    { name: "Cicero", stopId: "30188", lines: ["Pink"] },
    { name: "Kostner", stopId: "30189", lines: ["Pink"] },
    { name: "Pulaski", stopId: "30190", lines: ["Pink"] },
    { name: "Central Park", stopId: "30191", lines: ["Pink"] },
    { name: "Kedzie", stopId: "30192", lines: ["Pink"] },
    { name: "California", stopId: "30193", lines: ["Pink"] },
    { name: "Western", stopId: "30194", lines: ["Pink"] },
    { name: "Damen", stopId: "30195", lines: ["Pink"] },
    { name: "18th", stopId: "30196", lines: ["Pink"] },
    { name: "Polk", stopId: "30197", lines: ["Pink"] },
    { name: "Ashland", stopId: "30198", lines: ["Pink"] },
    { name: "Morgan", stopId: "30199", lines: ["Pink"] },
    { name: "Clinton", stopId: "30200", lines: ["Pink"] },
    { name: "Clark/Lake", stopId: "30131", lines: ["Pink"] }
  ],
  "Purple": [
    { name: "Linden", stopId: "30201", lines: ["Purple"] },
    { name: "Central", stopId: "30202", lines: ["Purple"] },
    { name: "Noyes", stopId: "30203", lines: ["Purple"] },
    { name: "Foster", stopId: "30204", lines: ["Purple"] },
    { name: "Davis", stopId: "30205", lines: ["Purple"] },
    { name: "Dempster", stopId: "30206", lines: ["Purple"] },
    { name: "Main", stopId: "30207", lines: ["Purple"] },
    { name: "South Blvd", stopId: "30208", lines: ["Purple"] },
    { name: "Howard", stopId: "30173", lines: ["Purple"] },
    { name: "Wilson", stopId: "30209", lines: ["Purple"] },
    { name: "Belmont", stopId: "30210", lines: ["Purple"] },
    { name: "Fullerton", stopId: "30211", lines: ["Purple"] },
    { name: "Armitage", stopId: "30212", lines: ["Purple"] },
    { name: "Sedgwick", stopId: "30213", lines: ["Purple"] },
    { name: "Chicago", stopId: "30214", lines: ["Purple"] },
    { name: "Merchandise Mart", stopId: "30768", lines: ["Purple"] },
    { name: "Clark/Lake", stopId: "30131", lines: ["Purple"] }
  ],
  "Yellow": [
    { name: "Howard", stopId: "30173", lines: ["Yellow"] },
    { name: "Oakton-Skokie", stopId: "30215", lines: ["Yellow"] },
    { name: "Dempster-Skokie", stopId: "30216", lines: ["Yellow"] }
  ]
};

const LINE_COLORS = {
  "Red": "bg-red-600",
  "Blue": "bg-blue-600", 
  "Brown": "bg-amber-700",
  "Green": "bg-green-600",
  "Orange": "bg-orange-500",
  "Pink": "bg-pink-500",
  "Purple": "bg-purple-600",
  "Yellow": "bg-yellow-500"
};

export const CTALineStationSelector = ({ onStationSelect }: CTALineStationSelectorProps) => {
  const [selectedLine, setSelectedLine] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<string>("");
  const { toast } = useToast();

  const handleLineChange = (line: string) => {
    setSelectedLine(line);
    setSelectedStation(""); // Reset station when line changes
  };

  const handleStationChange = (stationName: string) => {
    setSelectedStation(stationName);
    
    if (selectedLine && stationName) {
      const station = CTA_LINES_STATIONS[selectedLine as keyof typeof CTA_LINES_STATIONS]
        ?.find(s => s.name === stationName);
      
      if (station) {
        onStationSelect(station);
        toast({
          title: `Selected: ${station.name}`,
          description: `${selectedLine} Line | Stop ID: ${station.stopId}`,
        });
      }
    }
  };

  const availableStations = selectedLine 
    ? CTA_LINES_STATIONS[selectedLine as keyof typeof CTA_LINES_STATIONS] || []
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Train className="w-5 h-5" />
          Select CTA Line & Station
        </CardTitle>
        <CardDescription>
          Choose a line first, then select a station to get real-time arrivals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Line Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">CTA Line</label>
          <Select value={selectedLine} onValueChange={handleLineChange}>
            <SelectTrigger className="w-full bg-background border-2 z-50">
              <SelectValue placeholder="Select a CTA line..." />
            </SelectTrigger>
            <SelectContent className="bg-background border-2 shadow-lg z-50">
              {Object.keys(CTA_LINES_STATIONS).map((line) => (
                <SelectItem key={line} value={line} className="cursor-pointer hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${LINE_COLORS[line as keyof typeof LINE_COLORS]}`} />
                    <span>{line} Line</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Station Selector - Only show when line is selected */}
        {selectedLine && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Station on {selectedLine} Line
              <Badge variant="outline" className="ml-2">
                {availableStations.length} stations
              </Badge>
            </label>
            <Select value={selectedStation} onValueChange={handleStationChange}>
              <SelectTrigger className="w-full bg-background border-2 z-40">
                <SelectValue placeholder={`Select a ${selectedLine} line station...`} />
              </SelectTrigger>
              <SelectContent className="bg-background border-2 shadow-lg z-40 max-h-60">
                {availableStations.map((station) => (
                  <SelectItem key={station.stopId} value={station.name} className="cursor-pointer hover:bg-muted">
                    <div className="flex items-center justify-between w-full">
                      <span>{station.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ID: {station.stopId}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Selection Summary */}
        {selectedLine && selectedStation && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-700">Selected Station</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${LINE_COLORS[selectedLine as keyof typeof LINE_COLORS]}`} />
              <span className="font-medium">{selectedStation}</span>
              <Badge variant="outline" className="text-xs">
                {selectedLine} Line
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Stop ID: {availableStations.find(s => s.name === selectedStation)?.stopId}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>How to use:</strong> Select a line first, then choose your station. 
            The arrival times will automatically load for your selected station.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};