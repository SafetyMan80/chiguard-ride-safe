import { useServiceHealthCheck } from '@/hooks/useServiceHealthCheck';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export const SystemHealthIndicator = () => {
  const { serviceHealth, runHealthChecks } = useServiceHealthCheck();
  const [isChecking, setIsChecking] = useState(false);

  const handleRefresh = async () => {
    setIsChecking(true);
    await runHealthChecks();
    setIsChecking(false);
  };

  const unhealthyServices = Object.entries(serviceHealth.scheduleServices)
    .filter(([_, healthy]) => !healthy)
    .map(([service]) => service);

  const isOverallHealthy = serviceHealth.supabase && unhealthyServices.length === 0;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
      <div className="flex items-center gap-1">
        {isOverallHealthy ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
        <span className="text-sm font-medium">
          System Status
        </span>
      </div>
      
      <Badge variant={isOverallHealthy ? "default" : "destructive"}>
        {isOverallHealthy ? "All Systems Operational" : `${unhealthyServices.length} Service(s) Down`}
      </Badge>

      <Button
        size="sm"
        variant="ghost"
        onClick={handleRefresh}
        disabled={isChecking}
        className="h-6 px-2"
      >
        <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
      </Button>

      {unhealthyServices.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Issues: {unhealthyServices.join(', ').toUpperCase()}
        </div>
      )}
    </div>
  );
};