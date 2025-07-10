import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Twitter, Chrome } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) {
          // Handle specific error cases
          if (error.message.includes('Email address') && error.message.includes('invalid')) {
            throw new Error('Please enter a valid email address');
          }
          if (error.message.includes('User already registered')) {
            throw new Error('An account with this email already exists. Try signing in instead.');
          }
          throw error;
        }

        // Check if user was created but needs confirmation
        if (data.user && !data.session) {
          toast({
            title: "Account created!",
            description: "Please check your email and click the confirmation link to complete registration.",
          });
        } else if (data.session) {
          // User was created and signed in immediately (email confirmation disabled)
          toast({
            title: "Account created and signed in!",
            description: "Welcome to RAILSAVIOR!",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Handle specific sign-in errors
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Incorrect email or password. Please try again.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and click the confirmation link before signing in.');
          }
          throw error;
        }

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'facebook' | 'twitter' | 'google') => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Social auth error:', error);
      toast({
        title: "Social Login Error",
        description: error.message || "Failed to connect with social media. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center flex flex-col items-center space-y-4">
          <div className="flex justify-center">
            <Logo className="w-20 h-20 drop-shadow-xl" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-chicago-blue to-chicago-navy bg-clip-text text-transparent">
              RAILSAVIOR
            </h1>
            <p className="text-sm text-muted-foreground">
              Safety Driven...Community Powered
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? "Create Account" : "Welcome Back"}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? "Create your account to get started with RAILSAVIOR. Students: use your university email for instant verification!" 
                : "Sign in to your account to continue"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                variant="chicago"
                disabled={loading}
              >
                {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            {/* Social Login Section */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <Separator className="flex-1" />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialAuth('facebook')}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Facebook className="w-4 h-4" />
                  <span className="hidden sm:inline">Facebook</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialAuth('twitter')}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Twitter className="w-4 h-4" />
                  <span className="hidden sm:inline">Twitter</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialAuth('google')}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Chrome className="w-4 h-4" />
                  <span className="hidden sm:inline">Google</span>
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-chicago-blue hover:underline"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;