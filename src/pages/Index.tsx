import { useState, useEffect } from "react";
import { HomeScreen } from "@/components/HomeScreen";
import { AdminBootstrap } from "@/components/AdminBootstrap";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadTester } from "@/components/LoadTester";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Navigate } from "react-router-dom";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminBootstrap, setShowAdminBootstrap] = useState(false);
  const [showLoadTester, setShowLoadTester] = useState(false);

  // Check for load testing query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('loadtest') === 'true') {
      setShowLoadTester(true);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check if we need to show admin bootstrap
        if (session?.user) {
          setTimeout(() => {
            checkAdminBootstrap();
          }, 1000);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(() => {
          checkAdminBootstrap();
        }, 1000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminBootstrap = async () => {
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (!roles || roles.length === 0) {
        setShowAdminBootstrap(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show admin bootstrap if needed
  if (showAdminBootstrap) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <AdminBootstrap />
        </div>
      </ErrorBoundary>
    );
  }

  // Show load tester if requested
  if (showLoadTester) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-background text-foreground p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <button 
                onClick={() => setShowLoadTester(false)}
                className="text-primary hover:underline"
              >
                ← Back to App
              </button>
            </div>
            <LoadTester />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return <HomeScreen />;
};

export default Index;