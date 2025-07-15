import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const AdminBootstrap = () => {
  const [loading, setLoading] = useState(false);
  const [hasAdmins, setHasAdmins] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAdminStatus();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const checkAdminStatus = async () => {
    try {
      // Check if any admins exist
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }

      setHasAdmins((roles?.length || 0) > 0);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const bootstrapAdmin = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to become an admin");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('bootstrap_first_admin', {
        _user_id: currentUser.id
      });

      if (error) {
        throw error;
      }

      if (data) {
        toast.success("Successfully became the first admin!");
        setHasAdmins(true);
      } else {
        toast.error("Admin users already exist in the system");
      }
    } catch (error: any) {
      console.error('Error bootstrapping admin:', error);
      toast.error(error.message || "Failed to bootstrap admin");
    } finally {
      setLoading(false);
    }
  };

  if (hasAdmins === null) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasAdmins) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 text-green-600 mx-auto mb-2" />
          <CardTitle className="text-green-600">System Secured</CardTitle>
          <CardDescription>
            Admin users are configured and the system is properly secured.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-orange-200 bg-orange-50">
      <CardHeader className="text-center">
        <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-2" />
        <CardTitle className="text-orange-600">Security Alert</CardTitle>
        <CardDescription>
          No admin users found in the system. This is a security risk.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            As the first user, you can become the system administrator. 
            This will give you access to security features and user management.
          </AlertDescription>
        </Alert>
        
        {currentUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{currentUser.email}</span>
            </div>
            <Button 
              onClick={bootstrapAdmin}
              disabled={loading}
              className="w-full"
              variant="default"
            >
              {loading ? "Setting up..." : "Become First Admin"}
            </Button>
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              Please log in to bootstrap the first admin user.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};