
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MapPin, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { TermsOfService } from "./TermsOfService";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { SafetyGuidelines } from "./SafetyGuidelines";
import { ProfileSetup } from "./ProfileSetup";
import { ProfileManagement } from "./ProfileManagement";
import { IDVerification } from "./IDVerification";
import { SecurityAudit } from "./SecurityAudit";
import { NotificationSettings } from "./NotificationSettings";
import { ThemeToggle } from "./ThemeToggle";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface SettingsProps {
  user: SupabaseUser | null;
}

export const Settings = ({ user }: SettingsProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<'settings' | 'terms' | 'privacy' | 'safety' | 'profile' | 'profile-edit' | 'verification' | 'security' | 'notifications'>('settings');

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: t("Signed out"),
        description: t("You have been successfully signed out."),
      });
    } catch (error: any) {
      toast({
        title: t("Error"),
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
    return <ProfileManagement onBack={() => setActiveView('settings')} onEdit={() => setActiveView('profile-edit')} />;
  }

  if (activeView === 'profile-edit') {
    return <ProfileSetup onProfileComplete={() => setActiveView('profile')} onBack={() => setActiveView('profile')} />;
  }

  if (activeView === 'verification') {
    return <IDVerification onVerificationComplete={() => setActiveView('settings')} onBack={() => setActiveView('settings')} />;
  }

  if (activeView === 'notifications') {
    return <NotificationSettings onBack={() => setActiveView('settings')} />;
  }

  if (activeView === 'security') {
    return (
      <div className="space-y-4">
        <Button onClick={() => setActiveView('settings')} variant="outline">
          ← Back to Settings
        </Button>
        <SecurityAudit />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-5 h-5 bg-chicago-blue rounded text-white flex items-center justify-center text-xs font-bold">🛡</div>
          {t("Privacy & Safety Settings")}
        </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location Services */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{t("Location Services")}</span>
                <Badge variant={locationEnabled ? "secondary" : "outline"}>
                  {locationEnabled ? t("Enabled") : t("Disabled")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("Allow RAILSAVIOR to access your location for incident reporting and emergency services")}
              </p>
            </div>
            <Switch
              checked={locationEnabled}
              onCheckedChange={handleLocationToggle}
            />
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-medium">{t("Push Notifications")}</span>
              <p className="text-sm text-muted-foreground">
                {t("Location-based incident alerts and emergency notifications")}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveView('notifications')}
            >
              {t("Configure")}
            </Button>
          </div>

          {/* Emergency Contacts */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-medium">{t("Auto-Contact Emergency Contacts")}</span>
              <p className="text-sm text-muted-foreground">
                {t("Automatically notify your emergency contacts when SOS is activated")}
              </p>
            </div>
            <Switch
              checked={emergencyContactsEnabled}
              onCheckedChange={setEmergencyContactsEnabled}
            />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-medium">{t("App Theme")}</span>
              <p className="text-sm text-muted-foreground">
                {t("Switch between light and dark mode")}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Legal Documents */}
      <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-5 h-5 bg-chicago-blue rounded text-white flex items-center justify-center text-xs font-bold">📋</div>
          {t("Legal Information")}
        </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="chicago-outline" 
            className="w-full justify-start"
            onClick={() => setActiveView('privacy')}
          >
            <div className="w-4 h-4 mr-2 text-xs">👁</div>
            {t("Privacy Policy")}
          </Button>
          <Button 
            variant="chicago-outline" 
            className="w-full justify-start"
            onClick={() => setActiveView('terms')}
          >
            <div className="w-4 h-4 mr-2 text-xs">📋</div>
            {t("Terms of Service")}
          </Button>
          <Button 
            variant="chicago-outline" 
            className="w-full justify-start"
            onClick={() => setActiveView('safety')}
          >
            <div className="w-4 h-4 mr-2 text-xs">🛡</div>
            {t("Safety Guidelines")}
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-chicago-blue rounded text-white flex items-center justify-center text-xs font-bold">ℹ</div>
            {t("About RAILSAVIOR")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><span className="font-medium">{t("Established")}:</span> 2025</p>
            <p><span className="font-medium">{t("Mission")}:</span> {t("Community-powered safety for rail commuters across major US cities")}</p>
            <p><span className="font-medium">{t("Coverage")}:</span> {t("All major US cities with rail service")}</p>
            <p><span className="font-medium">{t("Disclaimer")}:</span> {t("Not affiliated with LA Metro, MTA (New York), WMATA (Washington D.C.), SEPTA (Philadelphia), MARTA (Atlanta), CTA (Chicago), or any other transit authority")}</p>
            <p className="text-muted-foreground italic pt-2">
              {t("RAILSAVIOR is an independent safety platform built by and for transit communities nationwide to enhance rail safety through real-time incident reporting and group ride coordination.")}
            </p>
          </div>
        </CardContent>
      </Card>


      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t("Account")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.email && (
            <p className="text-sm text-muted-foreground">
              {t("Signed in as")} {user.email}
            </p>
          )}
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setActiveView('profile')}
          >
            {t("Edit Profile")}
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setActiveView('verification')}
          >
            {t("ID Verification Status")}
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setActiveView('security')}
          >
            {t("🔒 Security Audit (Admin)")}
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("Sign Out Button")}
          </Button>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          <p>{t("RAILSAVIOR v1.0")}</p>
          <p>{t("Keeping rail commuters safe nationwide")}</p>
        </CardContent>
      </Card>
    </div>
  );
};
