import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HeaderSection } from "@/components/HeaderSection";
import { SystemHealthIndicator } from "@/components/SystemHealthIndicator";
import { MainContent } from "@/components/MainContent";
import { TabNavigation } from "@/components/TabNavigation";
import { ProfileSetup } from "@/components/ProfileSetup";
import { IDVerification } from "@/components/IDVerification";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Logo } from "@/components/Logo";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useOffline } from "@/hooks/useOffline";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useAnalytics } from "@/hooks/useAnalytics";
import QRCode from "qrcode";
import type { User } from "@supabase/supabase-js";

export const HomeScreen = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasIDVerification, setHasIDVerification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const navigate = useNavigate();
  const { isOnline, saveUserProfile, saveEmergencyContacts } = useOffline();
  const { trackAppLaunch, trackPageView } = useAnalytics();

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
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('HomeScreen auth state change:', event, !!session?.user);
        setUser(session?.user ?? null);
        if (!session?.user) {
          console.log('No user session, redirecting to auth');
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('HomeScreen initial session check:', !!session?.user);
      setUser(session?.user ?? null);
      if (!session?.user) {
        console.log('No initial session, redirecting to auth');
        navigate("/auth");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (user) {
      checkUserSetup();
      // Track app launch when user is authenticated
      trackAppLaunch();
    }
  }, [user, trackAppLaunch]);

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
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        // Continue with false value if error
      }

      console.log('Profile check:', { profile, hasProfile: !!profile });
      setHasProfile(!!profile);

      // Check if user has ID verification
      const { data: verification, error: verificationError } = await supabase
        .from("id_verifications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (verificationError) {
        console.error("Error fetching verification:", verificationError);
        // Continue with false value if error
      }

      console.log('ID verification check:', { verification, hasIDVerification: !!verification });
      setHasIDVerification(!!verification);
    } catch (error) {
      console.error("Error checking user setup:", error);
      // Set defaults on error to prevent blocking
      setHasProfile(false);
      setHasIDVerification(false);
    } finally {
      setLoading(false);
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

  // Temporarily bypass verification requirements to restore schedule functionality
  // if (!hasProfile) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center p-6">
  //       <ProfileSetup onProfileComplete={() => setHasProfile(true)} />
  //     </div>
  //   );
  // }

  // if (!hasIDVerification) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center p-6">
  //       <IDVerification onVerificationComplete={() => setHasIDVerification(true)} />
  //     </div>
  //   );
  // }

  return (
    <ErrorBoundary>
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
        
      <SystemHealthIndicator />
      <HeaderSection />

        <ErrorBoundary>
          <MainContent 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            qrCodeUrl={qrCodeUrl}
          />
        </ErrorBoundary>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/30 shadow-[var(--shadow-floating)] z-50">
          <div className="max-w-md mx-auto safe-area-bottom">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </nav>
      </div>
    </ErrorBoundary>
  );
};