import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { POPULAR_STATIONS, type Station } from "@/data/ctaStations";
import { getLineColors } from "@/utils/ctaUtils";

interface CTAStationSearchProps {
  onStationSelect: (station: Station) => void;
}

export const CTAStationSearch = ({ onStationSelect }: CTAStationSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredStations = POPULAR_STATIONS.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.lines.some(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStationSelect = (station: Station) => {
    if (station.stopId) {
      toast({
        title: `Selected: ${station.name}`,
        description: `Lines: ${station.lines.join(', ')} | Stop ID: ${station.stopId}`,
      });
      onStationSelect(station);
    } else {
      toast({
        title: `${station.name} Station`,
        description: `Lines: ${station.lines.join(', ')} | Stop ID not available`,
        variant: "destructive"
      });
    }
  };

  return (
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
  );
};