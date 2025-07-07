import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, WifiOff, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useEmergencyFailsafe } from '@/hooks/useEmergencyFailsafe';
import { useIncidentReports } from '@/hooks/useIncidentReports';

export const FailsafeIncidentReports = ({ city }: { city?: string }) => {
  const { reports, isLoading } = useIncidentReports(city);
  const { offlineQueue, isOnline, retryAttempts, processOfflineQueue } = useEmergencyFailsafe();
  const [failsafeActive, setFailsafeActive] = useState(false);

  // Activate failsafe mode when connection issues detected
  useEffect(() => {
    const hasFailures = retryAttempts > 0 || offlineQueue.length > 0 || !isOnline;
    setFailsafeActive(hasFailures);
  }, [retryAttempts, offlineQueue.length, isOnline]);

  // Priority incident detection - highlights emergencies
  const emergencyReports = reports.filter(report => 
    report.incident_type === 'emergency' || 
    report.description.toLowerCase().includes('emergency') ||
    report.description.includes('🚨')
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-orange-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Failsafe Status Banner */}
      {failsafeActive && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-5 h-5 text-green-500" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-500 animate-pulse" />
                  )}
                  <span className="font-medium">
                    {isOnline ? 'Connected' : 'OFFLINE MODE ACTIVE'}
                  </span>
                </div>
                
                {offlineQueue.length > 0 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {offlineQueue.length} queued reports
                  </Badge>
                )}
                
                {retryAttempts > 0 && (
                  <Badge variant="destructive">
                    {retryAttempts} retrying
                  </Badge>
                )}
              </div>

              {isOnline && offlineQueue.length > 0 && (
                <Button 
                  onClick={processOfflineQueue} 
                  size="sm" 
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Send Queued Reports
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Alerts - Always shown first */}
      {emergencyReports.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              🚨 EMERGENCY ALERTS ({emergencyReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {emergencyReports.map((report) => (
              <div 
                key={report.id} 
                className="p-3 bg-white border border-red-200 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        EMERGENCY
                      </Badge>
                      <span className="text-sm font-medium text-red-700">
                        {report.location_name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {report.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Offline Queue Status */}
      {offlineQueue.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="w-5 h-5" />
              Pending Reports ({offlineQueue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {offlineQueue.map((report) => (
              <div 
                key={report.id} 
                className="p-3 bg-white border border-yellow-200 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={report.status === 'failed' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {report.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {report.details}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(report.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {getStatusIcon(report.status)}
                </div>
              </div>
            ))}
            
            <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
              📡 These reports will be sent automatically when connection is restored
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Incident Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Safety Reports</span>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Live Updates
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  Cached Data
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-3">
              {reports.slice(0, 5).map((report) => (
                <div 
                  key={report.id} 
                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {report.incident_type}
                        </Badge>
                        <span className="text-sm font-medium">
                          {report.location_name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {report.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No recent safety reports
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};