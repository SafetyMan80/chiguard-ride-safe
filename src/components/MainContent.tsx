import { useState } from "react";
import { EmergencyButton } from "@/components/EmergencyButton";
import { MultiCitySchedule } from "@/components/MultiCitySchedule";
import { MultiCityIncidentReport } from "@/components/MultiCityIncidentReport";
import { MultiCityGroupRides } from "@/components/MultiCityGroupRides";
import { GeneralGroupRides } from "@/components/GeneralGroupRides";
import { Settings } from "@/components/Settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share, QrCode, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddToHomeScreen } from "@/hooks/useAddToHomeScreen";
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

  const handleEmergencyActivated = () => {
    toast({
      title: "🚨 EMERGENCY ALERT ACTIVATED! 🚨",
      description: "Your location has been shared and help is on the way!",
      variant: "destructive"
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: 'RAILSAVIOR - Safety App for Rail Commuters',
      text: 'Join me on RAILSAVIOR for safer transit across major US cities!',
      url: url
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Share this link with other riders.",
        });
      }
    } catch (error) {
      console.log('Share error:', error);
      // Fallback to clipboard if share fails
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Share this link with other riders.",
        });
      } catch (clipboardError) {
        console.log('Clipboard error:', clipboardError);
        toast({
          title: "Unable to share",
          description: "Please copy the URL manually to share.",
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
      description: "Emergency Alert",
      color: "bg-chicago-red text-white border-chicago-red/20",
    },
    {
      id: "incidents",
      title: "INCIDENTS",
      icon: "📝",
      description: "Report Issues",
      color: "bg-card text-card-foreground border-border hover:bg-muted/50",
    },
    {
      id: "groups",
      title: "UNIVERSITY",
      icon: "🎓",
      description: "Student Rides",
      color: "bg-card text-card-foreground border-border hover:bg-muted/50",
    },
    {
      id: "general",
      title: "GENERAL",
      icon: "👥",
      description: "Public Rides",
      color: "bg-card text-card-foreground border-border hover:bg-muted/50",
    },
    {
      id: "schedule",
      title: "SCHEDULE",
      icon: "🚇",
      description: "Rail Times",
      color: "bg-card text-card-foreground border-border hover:bg-muted/50",
    },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case "emergency":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <EmergencyButton onEmergencyActivated={handleEmergencyActivated} />
            </div>
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Quick Report</h2>
              <MultiCityIncidentReport />
            </div>
          </div>
        );
      case "incidents":
        return <MultiCityIncidentReport />;
      case "groups":
        return <MultiCityGroupRides />;
      case "general":
        return <GeneralGroupRides />;
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
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      ${item.color} p-6 rounded-xl shadow-[var(--shadow-card)] 
                      hover:scale-105 hover:shadow-[var(--shadow-floating)] 
                      active:scale-95 transition-all duration-300 flex flex-col items-center space-y-3
                      border touch-target-large min-h-[120px] justify-center
                    `}
                  >
                    <div className="text-3xl">{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="text-sm opacity-90">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Share Section */}
              <Card className="mt-8 bg-chicago-accent border-chicago-blue/20">
                <CardHeader className="text-center pb-3">
                   <CardTitle className="text-lg text-chicago-blue flex items-center justify-center gap-2">
                     <Share className="w-5 h-5" />
                     Share RAILSAVIOR
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Help build a safer transit community by sharing with other riders
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
                        <p className="text-xs text-muted-foreground">Scan to join</p>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={handleShare}
                        variant="chicago"
                        className="w-full touch-target"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share with Other Riders
                      </Button>
                      
                      {isInstallable && (
                        <Button 
                          onClick={promptInstall}
                          variant="chicago-outline"
                          className="w-full touch-target"
                        >
                          <Smartphone className="w-4 h-4 mr-2" />
                          Add to Home Screen
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