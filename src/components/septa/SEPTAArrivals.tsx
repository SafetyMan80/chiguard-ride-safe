import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2 } from "lucide-react";
import { SEPTAArrival, getLineColor } from "@/data/septaStations";

interface SEPTAArrivalsProps {
  selectedStation: string;
  arrivals: SEPTAArrival[];
  loading: boolean;
  lastUpdated: string | null;
}

export const SEPTAArrivals = ({
  selectedStation,
  arrivals,
  loading,
  lastUpdated
}: SEPTAArrivalsProps) => {
  if (!selectedStation) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Live Arrivals
          {lastUpdated && (
            <span className="text-sm font-normal text-muted-foreground">
              • Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && arrivals.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading arrivals...</span>
          </div>
        ) : arrivals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {selectedStation ? "No upcoming arrivals found" : "Enter a station name to view arrivals"}
          </div>
        ) : (
          <div className="space-y-3">
            {arrivals.map((arrival, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getLineColor(arrival.line)}`} />
                  <div>
                    <div className="font-medium">
                      {arrival.destination}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {arrival.line} • {arrival.direction}
                      {arrival.track && ` • Track ${arrival.track}`}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className={`font-bold ${
                    arrival.status === 'On Time' 
                      ? 'text-green-600' 
                      : arrival.status === 'Delayed'
                      ? 'text-red-600'
                      : 'text-foreground'
                  }`}>
                    {arrival.arrival}
                  </div>
                  {arrival.status !== 'On Time' && (
                    <Badge variant={arrival.status === 'Delayed' ? 'destructive' : 'secondary'} className="text-xs">
                      {arrival.status}
                    </Badge>
                  )}
                  {arrival.delay !== '0' && (
                    <div className="text-xs text-red-600">
                      +{arrival.delay} min
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};