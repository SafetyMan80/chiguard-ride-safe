import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { EmergencyButton } from "@/components/EmergencyButton";
import { MultiCitySchedule } from "@/components/MultiCitySchedule";
import { MultiCityIncidentReport } from "@/components/MultiCityIncidentReport";
import { MultiCityGroupRides } from "@/components/MultiCityGroupRides";
import { GeneralGroupRides } from "@/components/GeneralGroupRides";
import { Settings } from "@/components/Settings";
import { TabNavigation } from "@/components/TabNavigation";
import { ProfileSetup } from "@/components/ProfileSetup";
import { IDVerification } from "@/components/IDVerification";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useToast } from "@/hooks/use-toast";
import { useOffline } from "@/hooks/useOffline";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share, QrCode, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import type { User } from "@supabase/supabase-js";
import chicagoTrainGraphic from "@/assets/chicago-l-train-ai.jpg";
import { useAddToHomeScreen } from "@/hooks/useAddToHomeScreen";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasIDVerification, setHasIDVerification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isInstallable, promptInstall } = useAddToHomeScreen();
  const { isOnline, saveUserProfile, saveEmergencyContacts } = useOffline();

  // Pull to refresh functionality
  const handleRefresh = async () => {
    // Clear service worker cache to force fresh content
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }

    // Reload the page to get fresh content
    window.location.reload();
  };

  const {
    containerRef,
    isRefreshing,
    pullDistance,
    isPulling,
    threshold
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 120, // Increased from 80 to 120 for less sensitivity
    enabled: true
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      checkUserSetup();
    }
  }, [user]);

  useEffect(() => {
    // Generate QR code with current URL
    const currentUrl = window.location.href;
    QRCode.toDataURL(currentUrl)
      .then(url => setQrCodeUrl(url))
      .catch(err => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error generating QR code:', err);
        }
      });
  }, []);

  const checkUserSetup = async () => {
    if (!user) return;

    try {
      // Check if user has profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setHasProfile(!!profile);

      // Check if user has ID verification
      const { data: verification } = await supabase
        .from("id_verifications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setHasIDVerification(!!verification);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error checking user setup:", error);
      }
    } finally {
      setLoading(false);
    }
  };

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
      color: "bg-chicago-red text-white",
    },
    {
      id: "incidents",
      title: "INCIDENTS",
      icon: "📝",
      description: "Report Issues",
      color: "bg-slate-600 text-white",
    },
    {
      id: "groups",
      title: "UNIVERSITY",
      icon: "🎓",
      description: "Student Rides",
      color: "bg-chicago-blue/80 text-white",
    },
    {
      id: "general",
      title: "GENERAL",
      icon: "👥",
      description: "Public Rides",
      color: "bg-slate-600 text-white",
    },
    {
      id: "schedule",
      title: "SCHEDULE",
      icon: "🚇",
      description: "Rail Times",
      color: "bg-chicago-dark-blue text-white",
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
                      transition-all duration-300 flex flex-col items-center space-y-3
                      border border-white/20
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
              
              <div className="mt-8 flex justify-center">
                <img 
                  src={chicagoTrainGraphic}
                  alt="Chicago L Train" 
                  className="w-full max-w-lg h-40 object-cover rounded-lg opacity-70"
                />
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
                        className="w-full"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share with Other Riders
                      </Button>
                      
                      {isInstallable && (
                        <Button 
                          onClick={promptInstall}
                          variant="chicago-outline"
                          className="w-full"
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

  // Show setup screens if user hasn't completed profile/verification
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Logo className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <ProfileSetup onProfileComplete={() => setHasProfile(true)} />
      </div>
    );
  }

  if (!hasIDVerification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <IDVerification onVerificationComplete={() => setHasIDVerification(true)} />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background flex flex-col relative overflow-auto"
    >
      <PullToRefresh
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        isPulling={isPulling}
        threshold={threshold}
      />
      
      {/* Header */}
      <header className="p-6 safe-area-top">
        <OfflineIndicator />
        <Card className="bg-chicago-accent border-chicago-blue/20">
          <CardHeader className="text-center pb-3">
            <div className="flex items-center justify-center gap-2">
              <Logo className="w-12 h-12 md:w-16 md:h-16 drop-shadow-md" />
              <h1 className="text-2xl md:text-3xl font-urbanist font-black text-chicago-gunmetal tracking-tight">
                RAILSAVIOR
              </h1>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-center text-lg text-muted-foreground font-sans font-medium">
              Safety Driven...Community Powered
            </p>
          </CardContent>
        </Card>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 pb-24 max-w-md mx-auto w-full">
        {renderActiveTab()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border/50 shadow-[var(--shadow-floating)] safe-area-bottom">
        <div className="max-w-md mx-auto">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </nav>
    </div>
  );
};

export default Index;