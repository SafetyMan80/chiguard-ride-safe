import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Train, RefreshCw } from "lucide-react";
import { ScheduleCardSkeleton } from "../LoadingSkeleton";
import { type CTAArrival } from "@/data/ctaStations";
import { formatArrivalTime, getLineColor } from "@/utils/ctaUtils";

interface CTAArrivalsProps {
  stopId: string;
  setStopId: (stopId: string) => void;
  arrivals: CTAArrival[];
  loading: boolean;
  lastUpdated: string | null;
  onFetchArrivals: () => void;
}

export const CTAArrivals = ({ 
  stopId, 
  setStopId, 
  arrivals, 
  loading, 
  lastUpdated, 
  onFetchArrivals 
}: CTAArrivalsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Train className="w-5 h-5" />
          Real-Time CTA Schedule
        </CardTitle>
        <CardDescription>
          Enter a CTA stop ID to see live arrival times
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Stop ID (e.g., 30161)"
            value={stopId}
            onChange={(e) => setStopId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onFetchArrivals()}
          />
          <Button 
            onClick={onFetchArrivals}
            disabled={loading}
            variant="chicago"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Get Times"}
          </Button>
        </div>

        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}

        {arrivals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Live Arrivals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {arrivals.map((arrival, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getLineColor(arrival.rt)}`} />
                      <div>
                        <div className="font-medium">
                          {arrival.destNm} ({arrival.rt} Line)
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Train #{arrival.rn} • {arrival.staNm}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`font-bold ${
                        arrival.arrT === 'Due' || arrival.arrT === 'Approaching' 
                          ? 'text-green-600' 
                          : 'text-foreground'
                      }`}>
                        {formatArrivalTime(arrival.arrT)}
                      </div>
                      {arrival.isDly === '1' && (
                        <Badge variant="destructive" className="text-xs">
                          Delayed
                        </Badge>
                      )}
                      {arrival.isFlt === '1' && (
                        <Badge variant="secondary" className="text-xs">
                          Fault
                        </Badge>
                      )}
                      {arrival.isApp === '1' && (
                        <Badge variant="secondary" className="text-xs">
                          Approaching
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loading && arrivals.length === 0 && (
          <ScheduleCardSkeleton />
        )}

        {!loading && arrivals.length === 0 && stopId && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No arrivals found for Stop ID: {stopId}
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};