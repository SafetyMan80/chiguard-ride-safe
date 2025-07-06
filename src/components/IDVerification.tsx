import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera, Upload, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IDVerificationProps {
  onVerificationComplete: () => void;
  onBack?: () => void;
}

export const IDVerification = ({ onVerificationComplete, onBack }: IDVerificationProps) => {
  const [idType, setIdType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const idTypes = [
    { value: "drivers_license", label: "Driver's License" },
    { value: "state_id", label: "State ID" },
    { value: "student_id", label: "Student ID" },
    { value: "passport", label: "Passport" },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // Trigger camera input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadIDDocument = async () => {
    if (!selectedFile || !idType) {
      toast({
        title: "Missing information",
        description: "Please select an ID type and upload a photo",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${idType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('id-documents')
        .getPublicUrl(fileName);

      // Save verification record
      const { error: dbError } = await supabase
        .from('id_verifications')
        .insert({
          user_id: user.id,
          id_type: idType,
          id_image_url: publicUrl,
          verification_status: 'pending'
        });

      if (dbError) throw dbError;

      setVerificationStatus('pending');
      toast({
        title: "ID uploaded successfully!",
        description: "Your ID is being reviewed. You'll be notified once verified.",
      });

      onVerificationComplete();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-chicago-blue" />
              ID Verification
            </CardTitle>
            <CardDescription>
              Upload a clear photo of your ID for verification. This helps ensure the safety of all Rail Savior users.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>ID Type *</Label>
          <Select value={idType} onValueChange={setIdType}>
            <SelectTrigger>
              <SelectValue placeholder="Select your ID type" />
            </SelectTrigger>
            <SelectContent>
              {idTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Upload ID Photo *</Label>
          
          {!preview ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={handleCameraCapture}
              >
                <Camera className="w-8 h-8" />
                <span>Take Photo</span>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8" />
                <span>Upload File</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt="ID Preview"
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                  }}
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Photo
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileSelect}
            className="hidden"
            multiple={false}
          />
        </div>

        {verificationStatus && (
          <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Verification Pending</p>
              <p className="text-sm text-yellow-600">
                Your ID is being reviewed. This usually takes 24-48 hours.
              </p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Tips for a good ID photo:</h4>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• Ensure all text is clearly readable</li>
            <li>• Take the photo in good lighting</li>
            <li>• Avoid glare or shadows</li>
            <li>• Include the entire ID in the frame</li>
            <li>• Make sure the photo is not blurry</li>
          </ul>
        </div>

        <Button
          onClick={uploadIDDocument}
          disabled={uploading || !selectedFile || !idType}
          className="w-full"
          variant="chicago"
        >
          {uploading ? "Uploading..." : "Submit for Verification"}
        </Button>
      </CardContent>
    </Card>
  );
};