import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";
import { supabase } from "@/integrations/supabase/client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useLocationService } from "@/hooks/useLocationService";
import { useAppMonitoring } from "@/hooks/useAppMonitoring";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import "./utils/manualIncidentTest"; // Make manual test available in console

// Remove duplicate QueryClient - it's already created in main.tsx

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  
  // Initialize push notifications and location services
  const { isRegistered } = usePushNotifications();
  const { getCurrentLocation } = useLocationService();
  const { logUserAction } = useAppMonitoring();

  useEffect(() => {
    const initializeApp = async () => {
      // Set up auth listener first
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setAuthReady(true);
        if (event === 'SIGNED_IN' && session?.user) {
          const createdAt = new Date(((session.user as any).created_at) ?? new Date().toISOString());
          const justCreated = Date.now() - createdAt.getTime() < 5 * 60 * 1000; // 5 minutes window
          const notifiedKey = `signup_notified_${session.user.id}`;
          const alreadyNotified = localStorage.getItem(notifiedKey) === 'true';

          if (justCreated && !alreadyNotified) {
            setTimeout(() => {
              supabase.functions.invoke('notify-new-signup', {
                body: {
                  record: {
                    id: session.user.id,
                    email: session.user.email,
                    created_at: (session.user as any).created_at ?? new Date().toISOString(),
                    raw_user_meta_data: (session.user as any).user_metadata ?? {}
                  }
                }
              }).then(({ data, error }) => {
                if (error) console.error('Failed to invoke notify-new-signup:', error);
                else {
                  console.log('notify-new-signup invoked:', data);
                  localStorage.setItem(notifiedKey, 'true');
                }
              });
            }, 0);
          }
        }
      });
      
      // Wait for auth to initialize
      const { data: { session } } = await supabase.auth.getSession();
      setAuthInitialized(true);
      setAuthReady(true);
      
      // Request browser notification permission for SOS alerts
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          console.log('Notification permission:', permission);
        } catch (error) {
          console.log('Notification permission request failed:', error);
        }
      }
      
      // Show loading screen for 2 seconds as requested, but only after auth is ready
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      return () => subscription.unsubscribe();
    };

    initializeApp();
  }, []);

  if (isLoading || !authInitialized || !authReady) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      {/* QueryClient already provided in main.tsx */}
      <TooltipProvider>
          <Toaster />
          <Sonner />
          
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
    </ErrorBoundary>
  );
};

export default App;
