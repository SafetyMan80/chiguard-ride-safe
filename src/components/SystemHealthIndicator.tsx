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

  // Only show if there are actual issues
  if (isOverallHealthy) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
      <div className="flex items-center gap-1">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-800">
          System Status
        </span>
      </div>
      
      <Badge variant="destructive">
        {unhealthyServices.length} Service(s) Down
      </Badge>

      <Button
        size="sm"
        variant="ghost"
        onClick={handleRefresh}
        disabled={isChecking}
        className="h-6 px-2 text-amber-700 hover:text-amber-900"
      >
        <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
      </Button>

      <div className="text-xs text-amber-700">
        Issues: {unhealthyServices.join(', ').toUpperCase()}
      </div>
    </div>
  );
};