import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Train, RefreshCw } from "lucide-react";
import { type CTARoute } from "@/data/ctaStations";
import { getLineColor } from "@/utils/ctaUtils";

interface CTASystemOverviewProps {
  routes: CTARoute[];
  routesLoading: boolean;
  onFetchRoutes: () => void;
}

const ctaLines = [
  { code: 'Red', name: 'Red Line', color: 'bg-red-500' },
  { code: 'Blue', name: 'Blue Line', color: 'bg-blue-500' },
  { code: 'Brown', name: 'Brown Line', color: 'bg-amber-700' },
  { code: 'Green', name: 'Green Line', color: 'bg-green-500' },
  { code: 'Orange', name: 'Orange Line', color: 'bg-orange-500' },
  { code: 'Pink', name: 'Pink Line', color: 'bg-pink-500' },
  { code: 'Purple', name: 'Purple Line', color: 'bg-purple-500' },
  { code: 'Yellow', name: 'Yellow Line', color: 'bg-yellow-500' }
];

export const CTASystemOverview = ({ routes, routesLoading, onFetchRoutes }: CTASystemOverviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Train className="w-5 h-5" />
          CTA 'L' System Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ctaLines.map(line => (
            <div key={line.code} className="flex items-center gap-2 p-2 border rounded">
              <div className={`w-4 h-4 rounded ${line.color}`} />
              <span className="text-sm font-medium">{line.name}</span>
            </div>
          ))}
        </div>
        
        {/* Chicago Transit Tips */}
        <div className="bg-chicago-light-blue/10 border border-chicago-blue/20 p-4 rounded-lg">
          <h4 className="font-medium text-chicago-blue mb-2">🏙️ Chicago Transit Tips</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Use Ventra card for best fares and transfers</li>
            <li>• Loop stations connect multiple lines downtown</li>
            <li>• Blue Line connects both airports (O'Hare & Midway)</li>
            <li>• Red/Purple Lines run 24/7, others until ~2 AM</li>
            <li>• Allow extra time during Cubs/Sox games</li>
          </ul>
        </div>

        {/* Routes Section from API */}
        {routes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Available Routes (Live Data)</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={onFetchRoutes}
                disabled={routesLoading}
              >
                {routesLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {routes.map((route) => (
                <Button key={route.rt} variant="outline" size="sm" className="h-auto py-2">
                  <div className={`w-2 h-4 rounded mr-2 ${getLineColor(route.rtnm)}`} />
                  {route.rtnm}
                </Button>
              ))}
            </div>
          </div>
        )}

        {routesLoading && (
          <div className="text-center text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
            Loading routes...
          </div>
        )}
      </CardContent>
    </Card>
  );
};