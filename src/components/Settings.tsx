
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MapPin, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TermsOfService } from "./TermsOfService";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { SafetyGuidelines } from "./SafetyGuidelines";
import { ProfileSetup } from "./ProfileSetup";
import { IDVerification } from "./IDVerification";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface SettingsProps {
  user: SupabaseUser | null;
}

export const Settings = ({ user }: SettingsProps) => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'settings' | 'terms' | 'privacy' | 'safety' | 'profile' | 'verification'>('settings');

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  if (activeView === 'terms') {
    return <TermsOfService onBack={() => setActiveView('settings')} />;
  }

  if (activeView === 'privacy') {
    return <PrivacyPolicy onBack={() => setActiveView('settings')} />;
  }

  if (activeView === 'safety') {
    return <SafetyGuidelines onBack={() => setActiveView('settings')} />;
  }

  if (activeView === 'profile') {
    return <ProfileSetup onProfileComplete={() => setActiveView('settings')} onBack={() => setActiveView('settings')} />;
  }

  if (activeView === 'verification') {
    return <IDVerification onVerificationComplete={() => setActiveView('settings')} onBack={() => setActiveView('settings')} />;
  }

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
          <Button 
            variant="chicago-outline" 
            className="w-full justify-start"
            onClick={() => setActiveView('privacy')}
          >
            <div className="w-4 h-4 mr-2 text-xs">👁</div>
            Privacy Policy
          </Button>
          <Button 
            variant="chicago-outline" 
            className="w-full justify-start"
            onClick={() => setActiveView('terms')}
          >
            <div className="w-4 h-4 mr-2 text-xs">📋</div>
            Terms of Service
          </Button>
          <Button 
            variant="chicago-outline" 
            className="w-full justify-start"
            onClick={() => setActiveView('safety')}
          >
            <div className="w-4 h-4 mr-2 text-xs">🛡</div>
            Safety Guidelines
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.email && (
            <p className="text-sm text-muted-foreground">
              Signed in as {user.email}
            </p>
          )}
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setActiveView('profile')}
          >
            Edit Profile
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setActiveView('verification')}
          >
            ID Verification Status
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
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
