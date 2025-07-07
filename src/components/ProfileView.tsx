import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone_number: string;
  address: string;
  student_status: boolean;
  university_name: string;
  verification_status: string;
  verification_method: string;
  email_verified_university: string;
  created_at: string;
}

interface ProfileViewProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileView = ({ userId, isOpen, onClose }: ProfileViewProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive"
        });
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getVerificationBadge = () => {
    if (!profile?.student_status) return null;

    if (profile.verification_status === 'verified') {
      if (profile.verification_method === 'email_domain') {
        return (
          <Badge variant="default" className="bg-green-600">
            <Shield className="w-3 h-3 mr-1" />
            Email Verified Student
          </Badge>
        );
      } else {
        return (
          <Badge variant="default" className="bg-blue-600">
            <Shield className="w-3 h-3 mr-1" />
            Verified Student
          </Badge>
        );
      }
    } else if (profile.verification_status === 'pending') {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
          <Shield className="w-3 h-3 mr-1" />
          Student (Unverified)
        </Badge>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Profile
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading profile...</div>
          </div>
        ) : profile ? (
          <div className="space-y-4">
            {/* Header with Avatar and Name */}
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-chicago-light-blue text-chicago-dark-blue text-lg">
                  {profile.full_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{profile.full_name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {getVerificationBadge()}
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    Member since {formatDate(profile.created_at)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{profile.email}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">
                    {profile.phone_number || "Not provided"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">
                    {profile.address || "Not provided"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Student Information */}
            {profile.student_status && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">University:</span>
                    <span className="font-medium">
                      {profile.university_name || profile.email_verified_university || "Not specified"}
                    </span>
                  </div>
                  
                  {profile.verification_method === 'email_domain' && profile.email_verified_university && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      ✓ Automatically verified via university email domain
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Safety Note */}
            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <strong>Safety Note:</strong> Only connect with verified members and meet in public transit areas. 
              Report any suspicious behavior to campus security or local authorities.
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Profile information not available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};