import { useState } from "react";
import { EmergencyButton } from "@/components/EmergencyButton";
import { EmergencySOSButton } from "@/components/EmergencySOSButton";
import { MultiCitySchedule } from "@/components/MultiCitySchedule";
import { MultiCityIncidentReport } from "@/components/MultiCityIncidentReport";
import { GroupRideSelector } from "@/components/GroupRideSelector";
import { Settings } from "@/components/Settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share, QrCode, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddToHomeScreen } from "@/hooks/useAddToHomeScreen";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useLanguage } from "@/hooks/useLanguage";
import type { User } from "@supabase/supabase-js";

interface MainContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  qrCodeUrl: string;
}

export const MainContent = ({ activeTab, setActiveTab, user, qrCodeUrl }: MainContentProps) => {
  const { toast } = useToast();
  const { isInstallable, promptInstall } = useAddToHomeScreen();
  const { trackUserAction, trackPageView } = useAnalytics();
  const { t } = useLanguage();

  const handleEmergencyActivated = () => {
    trackUserAction('emergency_button_clicked');
    toast({
      title: t("🚨 EMERGENCY ALERT ACTIVATED! 🚨"),
      description: t("Your location has been shared and help is on the way!"),
      variant: "destructive"
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: 'RAILSAVIOR - Safety App for Rail Commuters',
      text: t("Join me on RAILSAVIOR for safer transit across major US cities!"),
      url: url
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        toast({
          title: t("Link copied!"),
          description: t("Share this link with other riders."),
        });
      }
    } catch (error) {
      console.log('Share error:', error);
      // Fallback to clipboard if share fails
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: t("Link copied!"),
          description: t("Share this link with other riders."),
        });
      } catch (clipboardError) {
        console.log('Clipboard error:', clipboardError);
        toast({
          title: t("Unable to share"),
          description: t("Please copy the URL manually to share."),
          variant: "destructive"
        });
      }
    }
  };

  const navigationItems = [
    {
      id: "emergency",
      title: "SOS",
      icon: "🚨",
      description: t("Emergency Alert"),
      color: "bg-gradient-to-br from-chicago-red to-chicago-red/90 text-white border-chicago-red/20 shadow-[var(--shadow-emergency)] hover:shadow-[var(--shadow-emergency)]",
      priority: true
    },
    {
      id: "incidents",
      title: t("INCIDENTS"),
      icon: "📝",
      description: t("Report Issues"),
      color: "bg-card/95 backdrop-blur-md text-card-foreground border-border/50 hover:bg-muted/50 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]",
    },
    {
      id: "groups",
      title: t("GROUP UP"),
      icon: "👥",
      description: t("Find Ride Partners"),
      color: "bg-card/95 backdrop-blur-md text-card-foreground border-border/50 hover:bg-muted/50 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]",
    },
    {
      id: "schedule",
      title: t("SCHEDULE"),
      icon: "🚇",
      description: t("Real-time Transit Data"),
      color: "bg-card/95 backdrop-blur-md text-card-foreground border-border/50 hover:bg-muted/50 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]",
    },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case "emergency":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <EmergencySOSButton />
            </div>
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">{t("Quick Report")}</h2>
              <MultiCityIncidentReport />
            </div>
          </div>
        );
      case "incidents":
        return <MultiCityIncidentReport />;
      case "groups":
        return <GroupRideSelector />;
      case "schedule":
        return <MultiCitySchedule />;
      case "settings":
        return <Settings user={user} />;
      case "home":
        return (
          <div className="space-y-8">
            <div className="text-center space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      trackPageView(item.id);
                      trackUserAction('tab_navigation', { tab: item.id });
                    }}
                    className={`
                      ${item.id === 'emergency' 
                        ? 'bg-gradient-to-br from-chicago-red via-chicago-red to-red-600 text-white shadow-[var(--shadow-emergency)]' 
                        : 'card-modern card-interactive hover:bg-muted/30'
                      } 
                      p-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] 
                      transition-all duration-300 ease-out flex flex-col items-center space-y-2
                      touch-target min-h-[96px] justify-center relative overflow-hidden
                    `}
                  >
                    {item.id === 'emergency' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-red-600/20 animate-pulse"></div>
                    )}
                    <div className={`text-3xl relative z-10 ${item.id === 'emergency' ? 'animate-pulse' : ''}`}>
                      {item.icon}
                    </div>
                    <div className="relative z-10 text-center">
                      <h3 className={`font-bold text-lg ${item.id === 'emergency' ? 'text-white' : ''}`}>
                        {item.title}
                      </h3>
                      <p className={`text-sm ${item.id === 'emergency' ? 'text-white/90' : 'text-muted-foreground'}`}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Share Section */}
              <Card className="mt-8 glass-card shadow-[var(--shadow-elevated)] border-chicago-blue/10">
                <CardHeader className="text-center pb-4">
                   <CardTitle className="text-lg text-chicago-blue flex items-center justify-center gap-2 font-semibold">
                     <div className="p-2 bg-chicago-blue/10 rounded-full">
                       <Share className="w-4 h-4" />
                     </div>
                     {t("Share RAILSAVIOR")}
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {t("Help build a safer transit community by sharing with other riders")}
                  </p>
                  
                  <div className="flex flex-col items-center space-y-4">
                    {qrCodeUrl && (
                      <div className="flex flex-col items-center space-y-2">
                        <QrCode className="w-4 h-4 text-chicago-blue" />
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code to share app" 
                          className="w-32 h-32 border-2 border-chicago-blue/20 rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground">{t("Scan to join")}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={handleShare}
                        variant="chicago"
                        className="w-full touch-target"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        {t("Share with Other Riders")}
                      </Button>
                      
                      {isInstallable && (
                        <Button 
                          onClick={promptInstall}
                          variant="chicago-outline"
                          className="w-full touch-target"
                        >
                          <Smartphone className="w-4 h-4 mr-2" />
                          {t("Add to Home Screen")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 p-6 pb-32 max-w-md mx-auto w-full">
      {renderActiveTab()}
    </main>
  );
};