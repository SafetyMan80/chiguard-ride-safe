import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Train, Clock, MapPin, RefreshCw, Loader2 } from "lucide-react";
import { CityConfig, StandardArrival } from "@/types/schedule";

interface MajorStationsDisplayProps {
  config: CityConfig;
  onStationClick?: (stationId: string) => void;
  fetchArrivals: (station: string) => Promise<StandardArrival[]>;
  formatArrivalTime?: (time: string) => string;
  getLineColor?: (line: string) => string;
}

interface StationWithArrivals {
  station: { id: string; name: string; lines?: string[]; popular?: boolean };
  arrivals: StandardArrival[];
  loading: boolean;
  error?: string;
}

export const MajorStationsDisplay: React.FC<MajorStationsDisplayProps> = ({
  config,
  onStationClick,
  fetchArrivals,
  formatArrivalTime = (time) => time,
  getLineColor = () => "bg-primary"
}) => {
  const [stationsData, setStationsData] = useState<StationWithArrivals[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Get major/popular stations
  const majorStations = config.stations.filter(s => 
    s.popular && s.id !== "all"
  ).slice(0, 6); // Show top 6 major stations

  const loadStationData = async (stationList: typeof majorStations) => {
    const initialData: StationWithArrivals[] = stationList.map(station => ({
      station,
      arrivals: [],
      loading: true
    }));
    
    setStationsData(initialData);

    // Load data for each station
    const promises = stationList.map(async (station, index) => {
      try {
        const arrivals = await fetchArrivals(station.name);
        return {
          index,
          station,
          arrivals: arrivals.slice(0, 3), // Show top 3 arrivals per station
          loading: false
        };
      } catch (error) {
        return {
          index,
          station,
          arrivals: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load'
        };
      }
    });

    // Update results as they come in
    Promise.allSettled(promises).then(results => {
      setStationsData(prevData => {
        const newData = [...prevData];
        results.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            newData[result.value.index] = result.value;
          } else {
            newData[i] = {
              ...newData[i],
              loading: false,
              error: 'Failed to load arrivals'
            };
          }
        });
        return newData;
      });
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStationData(majorStations);
    setRefreshing(false);
  };

  useEffect(() => {
    if (majorStations.length > 0) {
      loadStationData(majorStations);
    }
  }, [config.name]);

  const getNextArrival = (arrivals: StandardArrival[]) => {
    if (arrivals.length === 0) return "No arrivals";
    
    const first = arrivals[0];
    const time = formatArrivalTime(first.arrivalTime);
    
    // Determine status/prediction
    if (time === "Boarding" || time === "Arrived") return time;
    if (time === "Departing" || time === "Leaving") return "Departing";
    if (time.includes("min") || time.includes("minute")) return time;
    if (parseInt(time) <= 1) return "Arriving";
    
    return time;
  };

  const getStatusColor = (arrival: string) => {
    if (arrival === "Boarding" || arrival === "Arrived") return "destructive";
    if (arrival === "Departing" || arrival === "Leaving") return "secondary";
    if (arrival === "Arriving") return "default";
    return "outline";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Train className="w-5 h-5" />
              {config.icon} Major Stations
            </CardTitle>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Live arrivals for popular stations across {config.name}
          </p>
        </CardHeader>
      </Card>

      {/* Stations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stationsData.map((stationData, index) => (
          <Card 
            key={stationData.station.id} 
            className={`animate-fade-in cursor-pointer hover:shadow-md transition-shadow ${
              onStationClick ? 'hover:bg-muted/50' : ''
            }`}
            onClick={() => onStationClick?.(stationData.station.id)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Station Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">
                      {stationData.station.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      {stationData.station.lines?.slice(0, 3).map((lineId) => {
                        const line = config.lines.find(l => l.id === lineId);
                        return line ? (
                          <div
                            key={lineId}
                            className={`w-2 h-2 rounded-full ${line.color}`}
                            title={line.name}
                          />
                        ) : null;
                      })}
                      {(stationData.station.lines?.length || 0) > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{(stationData.station.lines?.length || 0) - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {stationData.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : stationData.error ? (
                    <Badge variant="destructive" className="text-xs">
                      Error
                    </Badge>
                  ) : (
                    <Badge 
                      variant={getStatusColor(getNextArrival(stationData.arrivals))}
                      className="text-xs font-bold"
                    >
                      {getNextArrival(stationData.arrivals)}
                    </Badge>
                  )}
                </div>

                {/* Next Arrivals */}
                {!stationData.loading && !stationData.error && stationData.arrivals.length > 0 && (
                  <div className="space-y-1">
                    {stationData.arrivals.slice(0, 2).map((arrival, arrIndex) => (
                      <div key={arrIndex} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 truncate">
                          <div className={`w-2 h-2 rounded-full ${getLineColor(arrival.line)} flex-shrink-0`} />
                          <span className="truncate">{arrival.destination}</span>
                        </div>
                        <span className="text-muted-foreground ml-1 flex-shrink-0">
                          {formatArrivalTime(arrival.arrivalTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* No data state */}
                {!stationData.loading && !stationData.error && stationData.arrivals.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    No upcoming arrivals
                  </div>
                )}

                {/* Error state */}
                {stationData.error && (
                  <div className="text-xs text-destructive text-center py-2">
                    {stationData.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading state for initial load */}
      {stationsData.length === 0 && (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading major stations...</p>
        </div>
      )}
    </div>
  );
};