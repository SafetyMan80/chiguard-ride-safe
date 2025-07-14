import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, CheckCircle, AlertTriangle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettingsProps {
  onBack?: () => void;
}

export const NotificationSettings = ({ onBack }: NotificationSettingsProps) => {
  const { isRegistered, token } = usePushNotifications();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(isRegistered);

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      toast({
        title: "Notifications Enabled",
        description: "You'll receive safety alerts and updates",
      });
    } else {
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications",
        variant: "destructive"
      });
    }
  };

  const sendTestNotification = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Test Notification', {
            body: 'This is a test notification from RailSafe',
            icon: '/icon-192.png'
          });
          toast({
            title: "Test Notification Sent",
            description: "Check if you received the notification",
          });
        }
      });
    }
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-4">
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 p-0 h-auto font-normal"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Safety Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified about incidents and emergencies
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge variant={isRegistered ? "default" : "secondary"}>
                <div className="flex items-center gap-1">
                  {isRegistered ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {isRegistered ? "Active" : "Inactive"}
                </div>
              </Badge>
            </div>

            {token && (
              <div className="text-xs text-muted-foreground">
                <p>Device registered for notifications</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={sendTestNotification}
              variant="outline"
              className="w-full"
              disabled={!notificationsEnabled}
            >
              Send Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Emergency Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Critical safety incidents requiring immediate attention
                </p>
              </div>
              <Badge variant="destructive">Always On</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Service Disruptions</p>
                <p className="text-sm text-muted-foreground">
                  Delays, cancellations, and service changes
                </p>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={handleToggleNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Safety Reports</p>
                <p className="text-sm text-muted-foreground">
                  Community-reported incidents and safety concerns
                </p>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={handleToggleNotifications} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>If you're not receiving notifications:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Check your device's notification settings</li>
              <li>Ensure RailSafe has notification permissions</li>
              <li>Try the test notification above</li>
              <li>Restart the app if issues persist</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};