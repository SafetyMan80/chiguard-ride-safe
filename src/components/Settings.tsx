import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

export const Settings = () => {
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emergencyContactsEnabled, setEmergencyContactsEnabled] = useState(false);

  const handleLocationToggle = (checked: boolean) => {
    setLocationEnabled(checked);
    if (checked) {
      // Request location permission
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location enabled:", position.coords);
        },
        (error) => {
          console.error("Location access denied:", error);
          setLocationEnabled(false);
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-5 h-5 bg-chicago-blue rounded text-white flex items-center justify-center text-xs font-bold">🛡</div>
          Privacy & Safety Settings
        </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location Services */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Location Services</span>
                <Badge variant={locationEnabled ? "secondary" : "outline"}>
                  {locationEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow CHIGUARD to access your location for incident reporting and emergency services
              </p>
            </div>
            <Switch
              checked={locationEnabled}
              onCheckedChange={handleLocationToggle}
            />
          </div>

          {/* Emergency Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-medium">Emergency Notifications</span>
              <p className="text-sm text-muted-foreground">
                Receive alerts about incidents near your location
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          {/* Emergency Contacts */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-medium">Auto-Contact Emergency Contacts</span>
              <p className="text-sm text-muted-foreground">
                Automatically notify your emergency contacts when SOS is activated
              </p>
            </div>
            <Switch
              checked={emergencyContactsEnabled}
              onCheckedChange={setEmergencyContactsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legal Documents */}
      <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-5 h-5 bg-chicago-blue rounded text-white flex items-center justify-center text-xs font-bold">📋</div>
          Legal Information
        </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="chicago-outline" className="w-full justify-start">
            <div className="w-4 h-4 mr-2 text-xs">👁</div>
            Privacy Policy
          </Button>
          <Button variant="chicago-outline" className="w-full justify-start">
            <div className="w-4 h-4 mr-2 text-xs">📋</div>
            Terms of Service
          </Button>
          <Button variant="chicago-outline" className="w-full justify-start">
            <div className="w-4 h-4 mr-2 text-xs">🛡</div>
            Safety Guidelines
          </Button>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          <p>CHIGUARD v1.0</p>
          <p>Keeping Chicago CTA riders safe together</p>
        </CardContent>
      </Card>
    </div>
  );
};