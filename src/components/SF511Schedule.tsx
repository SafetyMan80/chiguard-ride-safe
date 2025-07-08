import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, MapPin, AlertTriangle, Train, RefreshCw } from "lucide-react";
import { StandardScheduleLayout } from "./shared/StandardScheduleLayout";
import { ScheduleLoadingSkeleton } from "./LoadingStates";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { StandardScheduleProps, StandardArrival } from "@/types/schedule";

interface SF511ScheduleProps extends StandardScheduleProps {
  onBack: () => void;
}

interface SF511Arrival {
  MonitoredVehicleJourney: {
    LineRef: string;
    DirectionRef: string;
    DestinationName: string;
    MonitoredCall: {
      StopPointRef: string;
      StopPointName: string;
      ExpectedArrivalTime?: string;
      ExpectedDepartureTime?: string;
      AimedArrivalTime?: string;
      AimedDepartureTime?: string;
    };
    VehicleRef?: string;
  };
}

const BART_LINES = [
  { id: "01", name: "Richmond - Daly City/Millbrae", color: "bg-red-500" },
  { id: "03", name: "Richmond - Fremont", color: "bg-orange-500" },
  { id: "05", name: "Daly City - Dublin/Pleasanton", color: "bg-blue-500" },
  { id: "07", name: "Millbrae - Richmond", color: "bg-red-500" },
  { id: "11", name: "SFO - Millbrae", color: "bg-yellow-500" },
  { id: "19", name: "Daly City - Dublin/Pleasanton", color: "bg-blue-500" }
];

const MUNI_LINES = [
  { id: "N", name: "N-Judah", color: "bg-blue-600" },
  { id: "T", name: "T-Third Street", color: "bg-red-600" },
  { id: "K", name: "K-Ingleside", color: "bg-orange-600" },
  { id: "L", name: "L-Taraval", color: "bg-purple-600" },
  { id: "M", name: "M-Ocean View", color: "bg-green-600" },
  { id: "J", name: "J-Church", color: "bg-yellow-600" }
];

const MAJOR_STATIONS = [
  { id: "POWL", name: "Powell St (BART)", system: "BART" },
  { id: "MONT", name: "Montgomery St (BART)", system: "BART" },
  { id: "EMBR", name: "Embarcadero (BART)", system: "BART" },
  { id: "CIVC", name: "Civic Center (BART)", system: "BART" },
  { id: "16TH", name: "16th St Mission (BART)", system: "BART" },
  { id: "24TH", name: "24th St Mission (BART)", system: "BART" },
  { id: "GLEN", name: "Glen Park (BART)", system: "BART" },
  { id: "BALB", name: "Balboa Park (BART)", system: "BART" },
  { id: "DALY", name: "Daly City (BART)", system: "BART" },
  { id: "15552", name: "Van Ness Station (MUNI)", system: "MUNI" },
  { id: "15553", name: "Church & Duboce (MUNI)", system: "MUNI" },
  { id: "15554", name: "Castro Station (MUNI)", system: "MUNI" },
  { id: "15555", name: "West Portal (MUNI)", system: "MUNI" }
];

export const SF511Schedule = ({ onBack }: SF511ScheduleProps) => {
  const [arrivals, setArrivals] = useState<StandardArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("POWL");
  const [selectedSystem, setSelectedSystem] = useState<string>("BART");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌉 SF511 Fetching schedule...', { selectedStation, selectedSystem, selectedLine });

      const { data, error } = await supabase.functions.invoke('sf511-schedule', {
        body: {
          station: selectedStation,
          system: selectedSystem,
          line: selectedLine !== "all" ? selectedLine : undefined
        }
      });

      console.log('🌉 SF511 Response received:', { data, error });

      if (error) {
        console.error('🌉 SF511 Error:', error);
        throw new Error(error.message || 'Failed to fetch schedule');
      }

      if (data?.arrivals) {
        const transformedArrivals: StandardArrival[] = data.arrivals.map((arrival: SF511Arrival, index: number) => {
          const call = arrival.MonitoredVehicleJourney.MonitoredCall;
          const expectedTime = call.ExpectedArrivalTime || call.ExpectedDepartureTime;
          const aimedTime = call.AimedArrivalTime || call.AimedDepartureTime;
          
          return {
            id: `${arrival.MonitoredVehicleJourney.VehicleRef || index}`,
            line: arrival.MonitoredVehicleJourney.LineRef,
            destination: arrival.MonitoredVehicleJourney.DestinationName,
            arrivalTime: expectedTime || aimedTime || new Date().toISOString(),
            minutesToArrival: expectedTime ? 
              Math.max(0, Math.round((new Date(expectedTime).getTime() - new Date().getTime()) / 60000)) : 
              null,
            platform: call.StopPointName || selectedStation,
            status: expectedTime ? "On Time" : "Scheduled",
            headsign: arrival.MonitoredVehicleJourney.DestinationName,
            vehicleId: arrival.MonitoredVehicleJourney.VehicleRef
          };
        });

        setArrivals(transformedArrivals);
        setLastUpdated(new Date().toISOString());
      } else {
        setArrivals([]);
        console.log('🌉 SF511 No arrivals data received');
      }

    } catch (error) {
      console.error('🌉 SF511 Schedule fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch schedule');
      toast({
        title: "Schedule Error", 
        description: "Unable to fetch SF transit data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedStation, selectedSystem, selectedLine]);

  const filteredStations = MAJOR_STATIONS.filter(station => 
    selectedSystem === "all" || station.system === selectedSystem
  );

  const getLineColor = (lineId: string) => {
    const bartLine = BART_LINES.find(line => line.id === lineId);
    if (bartLine) return bartLine.color;
    
    const muniLine = MUNI_LINES.find(line => line.id === lineId);
    if (muniLine) return muniLine.color;
    
    return "bg-gray-500";
  };

  const formatArrivalTime = (arrival: StandardArrival) => {
    if (arrival.minutesToArrival !== null) {
      if (arrival.minutesToArrival === 0) return "Now";
      if (arrival.minutesToArrival < 60) return `${arrival.minutesToArrival} min`;
    }
    
    return new Date(arrival.arrivalTime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🌉 San Francisco BART/MUNI
          </h1>
          <p className="text-muted-foreground">Real-time Bay Area transit arrivals</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchSchedule}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-6">
        {/* System and Station Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Transit System & Station
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={selectedSystem} onValueChange={setSelectedSystem}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="BART">BART</TabsTrigger>
                <TabsTrigger value="MUNI">MUNI Metro</TabsTrigger>
                <TabsTrigger value="all">All Systems</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Station</label>
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {station.system}
                          </Badge>
                          {station.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Line Filter</label>
                <Select value={selectedLine} onValueChange={setSelectedLine}>
                  <SelectTrigger>
                    <SelectValue placeholder="All lines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lines</SelectItem>
                    {selectedSystem !== "MUNI" && BART_LINES.map((line) => (
                      <SelectItem key={line.id} value={line.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${line.color}`} />
                          {line.name}
                        </div>
                      </SelectItem>
                    ))}
                    {selectedSystem !== "BART" && MUNI_LINES.map((line) => (
                      <SelectItem key={line.id} value={line.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${line.color}`} />
                          {line.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Arrivals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Train className="w-5 h-5" />
              Upcoming Arrivals
              {loading && <RefreshCw className="w-4 h-4 animate-spin ml-auto" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && arrivals.length === 0 ? (
              <ScheduleLoadingSkeleton />
            ) : arrivals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Train className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming arrivals found</p>
                <p className="text-sm">Try selecting a different station or line</p>
              </div>
            ) : (
              <div className="space-y-3">
                {arrivals.map((arrival) => (
                  <div
                    key={arrival.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getLineColor(arrival.line)}`} />
                      <div>
                        <p className="font-medium">{arrival.line} - {arrival.destination}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {arrival.platform}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatArrivalTime(arrival)}
                      </p>
                      <Badge variant={arrival.status === "On Time" ? "default" : "secondary"} className="text-xs">
                        {arrival.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>🌉 Bay Area Transit Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Use Clipper Card or mobile app for seamless transfers between BART and MUNI</li>
              <li>• BART connects SF to East Bay, Peninsula, and SFO Airport</li>
              <li>• MUNI Metro serves neighborhoods within San Francisco</li>
              <li>• Powell St is the main downtown BART transfer station</li>
              <li>• Check 511.org for real-time service alerts and trip planning</li>
              <li>• Weekend service may have different schedules and routes</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};