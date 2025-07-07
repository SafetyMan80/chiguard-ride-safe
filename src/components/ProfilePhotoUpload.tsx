import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUpdate: (url: string | null) => void;
  size?: "sm" | "md" | "lg";
  userName?: string;
}

export const ProfilePhotoUpload = ({ 
  currentPhotoUrl, 
  onPhotoUpdate, 
  size = "lg",
  userName = "User" 
}: ProfilePhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16", 
    lg: "w-24 h-24"
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error("Please select an image file");
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be less than 5MB");
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      // Delete existing photo if it exists
      if (currentPhotoUrl) {
        const oldFileName = currentPhotoUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('profile-photos')
            .remove([`${user.id}/${oldFileName}`]);
        }
      }

      // Upload new photo
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Update profile with new photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onPhotoUpdate(publicUrl);
      toast({
        title: "Photo updated",
        description: "Your profile photo has been uploaded successfully.",
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!currentPhotoUrl) return;
    
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete from storage
      const fileName = currentPhotoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('profile-photos')
          .remove([`${user.id}/${fileName}`]);
      }

      // Update profile to remove photo URL
      const { error } = await supabase
        .from('profiles')
        .update({ profile_photo_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      onPhotoUpdate(null);
      toast({
        title: "Photo removed",
        description: "Your profile photo has been removed.",
      });

    } catch (error: any) {
      console.error('Remove error:', error);
      toast({
        title: "Remove failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhoto(file);
    }
  };

  if (size === "sm" || size === "md") {
    // Simple avatar display for smaller sizes
    return (
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={currentPhotoUrl} />
        <AvatarFallback className="bg-chicago-light-blue text-chicago-dark-blue">
          {userName[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className={sizeClasses[size]}>
              <AvatarImage src={currentPhotoUrl} />
              <AvatarFallback className="bg-chicago-light-blue text-chicago-dark-blue text-xl">
                {userName[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {currentPhotoUrl && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                onClick={removePhoto}
                disabled={uploading}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center space-y-2">
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <Button variant="outline" disabled={uploading} asChild>
                <span>
                  {uploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      {currentPhotoUrl ? "Change Photo" : "Add Photo"}
                    </>
                  )}
                </span>
              </Button>
            </Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground text-center">
              Upload a clear photo of yourself to help others recognize you when meeting up for rides.
              <br />
              Max size: 5MB. Formats: JPG, PNG, WebP
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};