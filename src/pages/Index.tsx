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
import chicagoTrainGraphic from "@/assets/chicago-train-graphic.jpg";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasIDVerification, setHasIDVerification] = useState(false);
  const [loading, setLoading] = useState(true);
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
      console.error("Error checking user setup:", error);
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
              <div>
                <div className="w-full h-2 bg-chicago-blue/70 rounded-full mb-4"></div>
                <p className="text-muted-foreground font-playfair italic text-lg">How Chicago Commutes</p>
              </div>
              
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
        <div className="flex items-center justify-center gap-4">
          <Logo className="w-20 h-20 drop-shadow-md" />
          <div className="text-center">
            <h1 className="text-3xl font-black bg-gradient-to-r from-chicago-red to-chicago-blue bg-clip-text text-transparent tracking-tight">
              CHIGUARD
            </h1>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2 font-playfair italic">
          Safety Driven...Community Powered
        </p>
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
