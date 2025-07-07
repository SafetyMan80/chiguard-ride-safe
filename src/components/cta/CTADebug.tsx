import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Train } from "lucide-react";
import { type CTAArrival, type CTARoute } from "@/data/ctaStations";

interface CTADebugProps {
  debugMode: boolean;
  setDebugMode: (mode: boolean) => void;
  loading: boolean;
  routesLoading: boolean;
  routes: CTARoute[];
  arrivals: CTAArrival[];
  stopId: string;
  lastUpdated: string | null;
  onFetchArrivalsForStopId: (stopId: string) => void;
  onFetchRoutes: () => void;
}

export const CTADebug = ({
  debugMode,
  setDebugMode,
  loading,
  routesLoading,
  routes,
  arrivals,
  stopId,
  lastUpdated,
  onFetchArrivalsForStopId,
  onFetchRoutes
}: CTADebugProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Train className="w-5 h-5" />
            Debug & Test CTA API
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDebugMode(!debugMode)}
          >
            {debugMode ? 'Hide Debug' : 'Show Debug'}
          </Button>
        </CardTitle>
      </CardHeader>
      {debugMode && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => onFetchArrivalsForStopId("30013")}
              disabled={loading}
            >
              🧪 Test Chicago/State (30013)
            </Button>
            <Button
              variant="outline"
              onClick={() => onFetchArrivalsForStopId("30089")}
              disabled={loading}
            >
              🧪 Test 95th/Dan Ryan (30089)
            </Button>
            <Button
              variant="outline"
              onClick={() => onFetchArrivalsForStopId("30171")}
              disabled={loading}
            >
              🧪 Test O'Hare (30171)
            </Button>
            <Button
              variant="outline"
              onClick={onFetchRoutes}
              disabled={routesLoading}
            >
              🧪 Test Routes API
            </Button>
          </div>
          
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-semibold mb-2">Debug Info:</p>
            <p>• Routes loaded: {routes.length}</p>
            <p>• Arrivals found: {arrivals.length}</p>
            <p>• Current Stop ID: {stopId || 'None'}</p>
            <p>• Last Updated: {lastUpdated || 'Never'}</p>
            <p>• Loading: {loading ? 'Yes' : 'No'}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};