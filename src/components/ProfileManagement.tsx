import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Shield, ArrowLeft, Edit } from "lucide-react";
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
  is_public_profile: boolean;
  created_at: string;
}

interface ProfileManagementProps {
  onBack: () => void;
  onEdit: () => void;
}

export const ProfileManagement = ({ onBack, onEdit }: ProfileManagementProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to view your profile",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
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
    if (profile?.verification_status === 'verified') {
      if (profile.verification_method === 'email_domain' && profile.student_status) {
        return (
          <Badge variant="default" className="bg-green-600">
            <Shield className="w-3 h-3 mr-1" />
            Email Verified Student
          </Badge>
        );
      } else if (profile.student_status) {
        return (
          <Badge variant="default" className="bg-blue-600">
            <Shield className="w-3 h-3 mr-1" />
            Verified Student
          </Badge>
        );
      } else {
        return (
          <Badge variant="default" className="bg-blue-600">
            <Shield className="w-3 h-3 mr-1" />
            Verified User
          </Badge>
        );
      }
    } else if (profile?.verification_status === 'pending' && profile?.student_status) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
          <Shield className="w-3 h-3 mr-1" />
          Student (Unverified)
        </Badge>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle>Profile Not Found</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No profile found. Please complete your profile setup.
          </p>
          <Button onClick={onEdit}>Create Profile</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              My Profile
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
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
              <Badge variant={profile.is_public_profile ? "secondary" : "outline"} className="text-xs">
                {profile.is_public_profile ? "Public Profile" : "Private Profile"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <CardHeader>
              <CardTitle className="text-base">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span>Profile Visibility:</span>
                <Badge variant={profile.is_public_profile ? "secondary" : "outline"}>
                  {profile.is_public_profile ? "Public" : "Private"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {profile.is_public_profile 
                  ? "Other users can view your profile when you create or join rides"
                  : "Your profile is private. You must make it public to create or join rides"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification Status */}
        {profile.verification_status && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Status: {profile.verification_status.charAt(0).toUpperCase() + profile.verification_status.slice(1)}
                  </span>
                </div>
                {profile.verification_method && (
                  <p className="text-xs text-muted-foreground">
                    Method: {profile.verification_method === 'email_domain' ? 'University Email Domain' : profile.verification_method}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};