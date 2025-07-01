import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { EmergencyButton } from "@/components/EmergencyButton";
import { IncidentReport } from "@/components/IncidentReport";
import { UniversityRides } from "@/components/UniversityRides";
import { CTASchedule } from "@/components/CTASchedule";
import { Settings } from "@/components/Settings";
import { TabNavigation } from "@/components/TabNavigation";
import { ProfileSetup } from "@/components/ProfileSetup";
import { IDVerification } from "@/components/IDVerification";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share, QrCode } from "lucide-react";
import QRCode from "qrcode";
import chicagoTrainGraphic from "@/assets/chicago-train-graphic.jpg";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasIDVerification, setHasIDVerification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

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
      title: "Emergency Alert Activated",
      description: "Your location has been shared and help is on the way.",
      variant: "destructive"
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: 'CHIGUARD - Safety App for Chicago Riders',
      text: 'Join me on CHIGUARD for safer transit in Chicago!',
      url: url
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Share this link with other riders.",
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sharing:', error);
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
      color: "bg-chicago-blue text-white",
    },
    {
      id: "groups",
      title: "GROUPRIDE",
      icon: "👥",
      description: "Join Rides",
      color: "bg-chicago-blue/80 text-white",
    },
    {
      id: "schedule",
      title: "SCHEDULE",
      icon: "🚇",
      description: "CTA Times",
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
              <IncidentReport />
            </div>
          </div>
        );
      case "incidents":
        return <IncidentReport />;
      case "groups":
        return <UniversityRides />;
      case "schedule":
        return <CTASchedule />;
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
                  className="w-full max-w-md h-32 object-cover rounded-lg opacity-60"
                />
              </div>
              
              {/* Share Section */}
              <Card className="mt-8 bg-chicago-accent border-chicago-blue/20">
                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-lg text-chicago-blue flex items-center justify-center gap-2">
                    <Share className="w-5 h-5" />
                    Share CHIGUARD
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
                    
                    <Button 
                      onClick={handleShare}
                      variant="chicago"
                      className="w-full"
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Share with Other Riders
                    </Button>
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-b from-white to-chicago-accent border-b border-border/50 p-6 shadow-[var(--shadow-card)] safe-area-top">
        <div className="flex items-center justify-center gap-1">
          <Logo className="w-20 h-20 drop-shadow-md" />
          <h1 className="text-4xl font-black bg-gradient-to-r from-chicago-red to-chicago-blue bg-clip-text text-transparent tracking-tight">
            CHIGUARD
          </h1>
        </div>
        <p className="text-center text-lg text-muted-foreground mt-2 font-playfair italic">
          Safety Driven...Community Powered
        </p>
        <div className="w-full h-1.5 bg-chicago-blue rounded-full mt-3"></div>
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
