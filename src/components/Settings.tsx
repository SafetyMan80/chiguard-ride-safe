
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
import { SecurityAudit } from "./SecurityAudit";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface SettingsProps {
  user: SupabaseUser | null;
}

export const Settings = ({ user }: SettingsProps) => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'settings' | 'terms' | 'privacy' | 'safety' | 'profile' | 'verification' | 'security'>('settings');

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
          if (process.env.NODE_ENV === 'development') {
            console.log("Location enabled:", position.coords);
          }
        },
        (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error("Location access denied:", error);
          }
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

  if (activeView === 'security') {
    return <SecurityAudit />;
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
                Allow RAIL SAVIOR to access your location for incident reporting and emergency services
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

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-chicago-blue rounded text-white flex items-center justify-center text-xs font-bold">ℹ</div>
            About RAIL SAVIOR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><span className="font-medium">Established:</span> 2025</p>
            <p><span className="font-medium">Mission:</span> Community-powered safety for rail commuters across major US cities</p>
            <p><span className="font-medium">Coverage:</span> All major US cities with rail service</p>
            <p><span className="font-medium">Disclaimer:</span> Not affiliated with LA Metro, MTA (New York), WMATA (Washington D.C.), SEPTA (Philadelphia), MARTA (Atlanta), CTA (Chicago), or any other transit authority</p>
            <p className="text-muted-foreground italic pt-2">
              RAIL SAVIOR is an independent safety platform built by and for transit communities nationwide to enhance rail safety through real-time incident reporting and group ride coordination.
            </p>
          </div>
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
            onClick={() => setActiveView('security')}
          >
            🔒 Security Audit (Admin)
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
          <p>RAIL SAVIOR v1.0</p>
          <p>Keeping rail commuters safe nationwide</p>
        </CardContent>
      </Card>
    </div>
  );
};
