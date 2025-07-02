import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ctaSystemMap from "@/assets/cta-system-map.jpg";

interface Station {
  name: string;
  lines: string[];
  stopId?: string;
}

const STATIONS: Station[] = [
  { name: "Union Station", lines: ["Blue"], stopId: "30161" },
  { name: "O'Hare Airport", lines: ["Blue"], stopId: "40890" },
  { name: "Midway Airport", lines: ["Orange"], stopId: "40350" },
  { name: "95th/Dan Ryan", lines: ["Red"], stopId: "30089" },
  { name: "Howard", lines: ["Red", "Purple", "Yellow"], stopId: "30173" },
  { name: "Clark/Lake", lines: ["Blue", "Brown", "Green", "Orange", "Pink", "Purple"], stopId: "30131" },
  { name: "Chicago/State", lines: ["Red"], stopId: "30013" },
  { name: "Millennium Station", lines: ["Metra"], stopId: "30001" },
  { name: "Roosevelt", lines: ["Red", "Orange", "Green"], stopId: "30001" },
  { name: "Fullerton", lines: ["Red", "Brown", "Purple"], stopId: "30057" },
  { name: "Belmont", lines: ["Red", "Brown", "Purple"], stopId: "30057" },
  { name: "Addison", lines: ["Red"], stopId: "30278" },
  { name: "Wilson", lines: ["Red", "Purple"], stopId: "30212" },
  { name: "Garfield", lines: ["Red"], stopId: "30067" },
  { name: "35th/Bronzeville", lines: ["Green"], stopId: "30120" },
  { name: "Ashland/63rd", lines: ["Green"], stopId: "30120" },
  { name: "Pulaski", lines: ["Blue"], stopId: "30161" },
  { name: "Western", lines: ["Blue", "Brown"], stopId: "30161" },
  { name: "California", lines: ["Blue"], stopId: "30161" },
  { name: "Logan Square", lines: ["Blue"], stopId: "30161" }
];

export const CTAMap = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast();

  const filteredStations = STATIONS.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.lines.some(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStationSelect = (station: Station) => {
    toast({
      title: `${station.name} Station`,
      description: `Lines: ${station.lines.join(', ')}${station.stopId ? ` | Stop ID: ${station.stopId}` : ''}`,
    });
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

  return (
    <div className="space-y-6">
      {/* CTA System Map Display */}
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
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={ctaSystemMap}
                  alt="CTA System Map"
                  className="w-full h-auto"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Tap stations below to find stop IDs and line information
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Station Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Stations
          </CardTitle>
          <CardDescription>
            Search for CTA stations and get real-time information
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
            {filteredStations.slice(0, 10).map((station, index) => (
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
    </div>
  );
};