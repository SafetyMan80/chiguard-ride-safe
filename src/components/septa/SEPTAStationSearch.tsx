import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, RefreshCw } from "lucide-react";
import { popularStations } from "@/data/septaStations";

interface SEPTAStationSearchProps {
  selectedStation: string;
  setSelectedStation: (station: string) => void;
  onFetchArrivals: () => void;
  loading: boolean;
}

export const SEPTAStationSearch = ({
  selectedStation,
  setSelectedStation,
  onFetchArrivals,
  loading
}: SEPTAStationSearchProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Enter station name (e.g., 30th Street Station, City Hall)"
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onFetchArrivals()}
          />
        </div>
        <Button 
          onClick={onFetchArrivals} 
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
          onClick={onFetchArrivals} 
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
    </div>
  );
};