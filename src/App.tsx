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
      });
      
      // Wait for auth to initialize
      const { data: { session } } = await supabase.auth.getSession();
      setAuthInitialized(true);
      setAuthReady(true);
      
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
