import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Train, Clock, MapPin, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { StandardArrival, CityConfig } from "@/types/schedule";

interface StandardScheduleLayoutProps {
  config: CityConfig;
  selectedLine: string;
  selectedStation: string;
  arrivals: StandardArrival[];
  loading: boolean;
  lastUpdated: string;
  isOnline: boolean;
  onLineChange: (line: string) => void;
  onStationChange: (station: string) => void;
  onRefresh: () => void;
  formatArrivalTime?: (time: string) => string;
  getLineColor?: (line: string) => string;
}

export const StandardScheduleLayout: React.FC<StandardScheduleLayoutProps> = ({
  config,
  selectedLine,
  selectedStation,
  arrivals,
  loading,
  lastUpdated,
  isOnline,
  onLineChange,
  onStationChange,
  onRefresh,
  formatArrivalTime = (time) => time,
  getLineColor = () => "bg-primary"
}) => {
  
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Train className="w-5 h-5" />
              {config.icon} {config.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isOnline ? (
                <><Wifi className="w-4 h-4" /> Online</>
              ) : (
                <><WifiOff className="w-4 h-4" /> Offline</>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {config.description} • {config.agency}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Line and Station Selectors */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedLine} onValueChange={onLineChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    All Lines
                  </div>
                </SelectItem>
                {config.lines.filter(line => line.id !== "all").map((line) => (
                  <SelectItem key={line.id} value={line.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${line.color}`} />
                      {line.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStation} onValueChange={onStationChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Station" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">All Stations</SelectItem>
                {selectedLine === "all" ? (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Popular Stations
                    </div>
                    {config.stations.filter(s => s.popular && s.id !== "all").map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      {config.lines.find(l => l.id === selectedLine)?.name} Stations
                    </div>
                    {(() => {
                      const filteredStations = config.stations
                        .filter(s => s.lines?.includes(selectedLine) && s.id !== "all");
                      console.log('🚉 Station filtering:', { 
                        selectedLine, 
                        availableStations: config.stations.length,
                        filteredStations: filteredStations.length,
                        stations: filteredStations.map(s => ({ id: s.id, name: s.name, lines: s.lines }))
                      });
                      return filteredStations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name}
                        </SelectItem>
                      ));
                    })()}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-between items-center">
            <Button 
              onClick={onRefresh} 
              disabled={loading || !isOnline}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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

      {/* Arrivals Display */}
      {arrivals.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            Real-time Arrivals ({arrivals.length})
          </h3>
          {arrivals.slice(0, 10).map((arrival, index) => (
            <Card key={index} className="animate-fade-in">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getLineColor(arrival.line)}`} />
                    <div>
                      <div className="font-semibold">{arrival.line}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {arrival.station}
                      </div>
                      <div className="text-sm">
                        To {arrival.destination}
                        {arrival.direction && ` (${arrival.direction})`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        arrival.status === "Boarding" || arrival.arrivalTime === "Boarding" ? "destructive" :
                        arrival.status === "Arrived" || arrival.arrivalTime === "Arrived" ? "secondary" :
                        "default"
                      }
                      className="text-lg font-bold"
                    >
                      {formatArrivalTime(arrival.arrivalTime)}
                    </Badge>
                    {arrival.delay && arrival.delay !== "0" && (
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
              <div>Loading schedule...</div>
            ) : (
              <div>
                <div className="mb-2">No upcoming arrivals found for the selected criteria.</div>
                <div className="text-sm text-muted-foreground">
                  Try selecting a different line/station or check back during peak hours for real-time data.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* City Tips */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              {config.icon} {config.name} Transit Tips
            </h4>
            <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
              {config.tips.map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};