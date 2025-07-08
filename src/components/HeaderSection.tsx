import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface HeaderSectionProps {
  user?: SupabaseUser | null;
}

export const HeaderSection = ({ user }: HeaderSectionProps) => {
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_photo_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.profile_photo_url) {
          setProfilePhotoUrl(profile.profile_photo_url);
        }
      } catch (error) {
        console.error("Error fetching profile photo:", error);
      }
    };

    fetchProfilePhoto();
  }, [user]);
  return (
    <header className="p-6 safe-area-top bg-gradient-to-b from-background via-background/95 to-background/90 -mx-6 px-6 backdrop-blur-md">
      <OfflineIndicator />
      <div className="flex justify-between items-center mb-6">
        <div className="w-10 h-10 flex items-center justify-start">
          {user && profilePhotoUrl && (
            <Avatar className="w-10 h-10 border-2 border-chicago-blue/20 shadow-lg">
              <AvatarImage 
                src={profilePhotoUrl} 
                alt="Profile" 
                className="object-cover w-full h-full"
              />
              <AvatarFallback className="bg-chicago-blue/10">
                <User className="w-5 h-5 text-chicago-blue" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <ThemeToggle />
        <div className="w-10 h-10"> {/* Spacer for balance */}
        </div>
      </div>
      <Card className="glass-card shadow-[var(--shadow-elevated)] border-chicago-blue/10">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-chicago-blue/20 rounded-full blur-xl"></div>
              <Logo className="relative w-24 h-24 md:w-28 md:h-28 drop-shadow-2xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-proxima text-white tracking-tight text-center">
              <span className="font-black">RAIL</span><span className="font-normal">SAVIOR</span>
            </h1>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <p className="text-center text-base text-muted-foreground/80 font-medium">
            Safety Driven...Community Powered
          </p>
        </CardContent>
      </Card>
    </header>
  );
};