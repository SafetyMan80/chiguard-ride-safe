import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, MapPin, TestTube, Smartphone, ArrowLeft } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useLocationService } from '@/hooks/useLocationService';

interface NotificationSettingsProps {
  onBack?: () => void;
}

export const NotificationSettings = ({ onBack }: NotificationSettingsProps) => {
  const { 
    isRegistered, 
    notificationPermission, 
    userCity, 
    sendTestNotification, 
    toggleNotifications,
    getCityDisplayName
  } = usePushNotifications();
  
  const { 
    location, 
    loading, 
    getCurrentLocation, 
    requestLocationPermissions, 
    permissionStatus 
  } = useLocationService();

  const getPermissionBadge = (permission: string) => {
    switch (permission) {
      case 'granted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="outline">Not Set</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {onBack && (
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Button>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isRegistered ? (
                <Bell className="w-5 h-5 text-green-500" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  Push Notifications {isRegistered ? 'Enabled' : 'Disabled'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRegistered 
                    ? 'You\'ll receive incident alerts' 
                    : 'Enable to receive safety alerts'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionBadge(notificationPermission)}
              <Switch
                checked={isRegistered}
                onCheckedChange={toggleNotifications}
              />
            </div>
          </div>

          {/* Location-Based Filtering */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Location-Based Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Only receive alerts for your city's transit system
                  </p>
                </div>
              </div>
              {getPermissionBadge(permissionStatus)}
            </div>

            {userCity ? (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <p className="text-sm text-blue-800">
                  📍 <strong>Current Location:</strong> {getCityDisplayName(userCity)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  You'll only receive incident alerts for this transit system
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  🌐 <strong>All Cities Mode:</strong> You'll receive alerts for all transit systems
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Enable location access to filter alerts by your city
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={getCurrentLocation}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                {loading ? 'Getting Location...' : 'Update Location'}
              </Button>
              
              {permissionStatus !== 'granted' && (
                <Button
                  onClick={requestLocationPermissions}
                  variant="outline"
                  size="sm"
                >
                  Enable Location
                </Button>
              )}
            </div>
          </div>

          {/* Test Notifications */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TestTube className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">Test Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Send a test alert to verify notifications are working
                  </p>
                </div>
              </div>
              <Button
                onClick={sendTestNotification}
                disabled={!isRegistered}
                variant="outline"
                size="sm"
              >
                Send Test
              </Button>
            </div>
          </div>

          {/* Mobile App Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">📱 Mobile App Features</p>
                <p className="text-sm text-blue-700 mt-1">
                  For the best notification experience, install RAILSAVIOR as a mobile app. 
                  Push notifications work even when the app is closed.
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-blue-600">
                    • Background notifications
                  </p>
                  <p className="text-xs text-blue-600">
                    • Location-based filtering  
                  </p>
                  <p className="text-xs text-blue-600">
                    • Emergency alert sounds
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Permission Troubleshooting */}
          {(notificationPermission === 'denied' || permissionStatus === 'denied') && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="font-medium text-red-800">⚠️ Permissions Needed</p>
              <p className="text-sm text-red-700 mt-1">
                To receive incident alerts, please enable permissions in your device settings:
              </p>
              <ul className="text-xs text-red-600 mt-2 space-y-1">
                <li>• Go to Settings → Notifications → RAILSAVIOR → Allow Notifications</li>
                <li>• Go to Settings → Privacy & Security → Location Services → RAILSAVIOR → While Using App</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};