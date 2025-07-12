import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Shield, ArrowLeft, Edit, Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";

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
  profile_photo_url: string;
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
  const { t } = useLanguage();

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
          title: t("Error"),
          description: t("Failed to load profile information"),
          variant: "destructive"
        });
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: t("Error"), 
        description: t("An unexpected error occurred"),
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

  const handleExportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('user-data-management', {
        body: { action: 'export', userId: user.id }
      });

      if (error) throw error;

      // Create and download the file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `railsavior-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Data exported successfully",
        description: "Your data has been downloaded to your device.",
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export your data",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('user-data-management', {
        body: { action: 'delete', userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
      });

      // Sign out the user
      await supabase.auth.signOut();
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete your account",
        variant: "destructive"
      });
    }
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
        {/* Profile Photo */}
        <ProfilePhotoUpload
          currentPhotoUrl={profile.profile_photo_url}
          onPhotoUpdate={(url) => {
            setProfile(prev => prev ? { ...prev, profile_photo_url: url || "" } : null);
          }}
          userName={profile.full_name}
        />

        {/* Header with Avatar and Name */}
        <div className="flex items-center gap-4">
          <ProfilePhotoUpload
            currentPhotoUrl={profile.profile_photo_url}
            onPhotoUpdate={() => {}} // Read-only in this context
            size="md"
            userName={profile.full_name}
          />
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

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleExportData}
            >
              <Download className="w-4 h-4 mr-2" />
              Export My Data
            </Button>
            <p className="text-xs text-muted-foreground">
              Download a complete copy of all your data stored in RAILSAVIOR
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:
                    <br />• Profile information
                    <br />• Group ride history
                    <br />• Messages and incident reports
                    <br />• All associated data
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};