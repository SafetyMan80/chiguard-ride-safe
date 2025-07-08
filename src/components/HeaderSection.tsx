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
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center justify-start">
          {user && profilePhotoUrl && (
            <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-chicago-blue/20 shadow-lg ring-2 ring-chicago-blue/10">
              <AvatarImage 
                src={profilePhotoUrl} 
                alt="Profile" 
                className="object-cover w-full h-full"
              />
              <AvatarFallback className="bg-chicago-blue/10">
                <User className="w-8 h-8 md:w-10 md:h-10 text-chicago-blue" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <ThemeToggle />
        <div className="w-16 h-16 md:w-20 md:h-20"> {/* Spacer for balance */}
        </div>
      </div>
      <Card className="glass-card shadow-[var(--shadow-elevated)] border-chicago-blue/10">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-chicago-blue/20 rounded-full blur-xl"></div>
              <Logo className="relative w-32 h-32 md:w-36 md:h-36 drop-shadow-2xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-proxima text-black dark:text-white tracking-tight text-center">
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