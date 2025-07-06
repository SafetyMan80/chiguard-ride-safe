import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Camera, Upload, CheckCircle, AlertCircle, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IDVerificationProps {
  onVerificationComplete: () => void;
  onBack?: () => void;
  requiredUniversity?: string; // If specified, only allow this university
}

export const IDVerification = ({ onVerificationComplete, onBack, requiredUniversity }: IDVerificationProps) => {
  const [idType, setIdType] = useState("");
  const [universityName, setUniversityName] = useState(requiredUniversity || "");
  const [studentIdNumber, setStudentIdNumber] = useState("");
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

  const universities = [
    "Northwestern University",
    "University of Chicago", 
    "University of Illinois Chicago",
    "DePaul University",
    "Loyola University Chicago",
    "Illinois Institute of Technology",
    "Roosevelt University",
    "Columbia College Chicago",
    "Northeastern Illinois University",
    // NY Universities
    "Columbia University",
    "New York University",
    "Cornell University",
    "Syracuse University",
    "Stony Brook University",
    "University at Buffalo",
    "Fordham University",
    "City University of New York",
    "The New School",
    "Pace University",
    "St. John's University",
    "Pratt Institute",
    // Denver Universities
    "University of Colorado Denver",
    "University of Denver",
    "Metropolitan State University of Denver",
    "Regis University",
    "Colorado State University Denver",
    // Other major universities
    "University of California, Los Angeles",
    "University of Southern California",
    "California Institute of Technology",
    "George Washington University",
    "Georgetown University",
    "American University",
    "Howard University",
    "University of Pennsylvania",
    "Temple University",
    "Drexel University",
    "Georgia Institute of Technology",
    "Emory University",
    "Georgia State University"
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

    // Additional validation for student IDs
    if (idType === 'student_id') {
      if (!universityName || !studentIdNumber) {
        toast({
          title: "Missing information",
          description: "Please provide university name and student ID number for student ID verification",
          variant: "destructive",
        });
        return;
      }
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

      // Save verification record with enhanced data
      const verificationData: any = {
        user_id: user.id,
        id_type: idType,
        id_image_url: publicUrl,
        verification_status: 'pending'
      };

      // Add university-specific fields for student IDs
      if (idType === 'student_id') {
        verificationData.university_name = universityName;
        verificationData.student_id_number = studentIdNumber;
        verificationData.verification_notes = `Student ID verification for ${universityName}`;
      }

      const { error: dbError } = await supabase
        .from('id_verifications')
        .insert(verificationData);

      if (dbError) throw dbError;

      setVerificationStatus('pending');
      toast({
        title: "ID uploaded successfully!",
        description: idType === 'student_id' 
          ? `Your ${universityName} student ID is being reviewed. You'll be notified once verified.`
          : "Your ID is being reviewed. You'll be notified once verified.",
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
              <Shield className="w-5 h-5 text-chicago-blue" />
              ID Verification
              {requiredUniversity && (
                <span className="text-sm font-normal text-muted-foreground">
                  for {requiredUniversity}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {idType === 'student_id' || requiredUniversity
                ? "Upload your student ID to verify your university enrollment and access student group rides."
                : "Upload a clear photo of your ID for verification. This helps ensure the safety of all RAILSAVIOR users."
              }
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

        {/* Additional fields for student ID verification */}
        {idType === 'student_id' && (
          <>
            <div className="space-y-2">
              <Label>University *</Label>
              <Select 
                value={universityName} 
                onValueChange={setUniversityName}
                disabled={!!requiredUniversity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((uni) => (
                    <SelectItem key={uni} value={uni}>
                      {uni}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {requiredUniversity && (
                <p className="text-xs text-muted-foreground">
                  University is pre-selected for this verification.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Student ID Number *</Label>
              <Input
                type="text"
                placeholder="Enter your student ID number"
                value={studentIdNumber}
                onChange={(e) => setStudentIdNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This helps us verify your student status with your university.
              </p>
            </div>
          </>
        )}

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
          <h4 className="font-medium text-blue-800 mb-2">
            {idType === 'student_id' ? 'Tips for student ID verification:' : 'Tips for a good ID photo:'}
          </h4>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• Ensure all text is clearly readable</li>
            <li>• Take the photo in good lighting</li>
            <li>• Avoid glare or shadows</li>
            <li>• Include the entire ID in the frame</li>
            <li>• Make sure the photo is not blurry</li>
            {idType === 'student_id' && (
              <>
                <li>• Ensure university name is visible</li>
                <li>• Student ID number should be legible</li>
                <li>• Include current semester/year if shown</li>
              </>
            )}
          </ul>
        </div>

        <Button
          onClick={uploadIDDocument}
          disabled={uploading || !selectedFile || !idType || (idType === 'student_id' && (!universityName || !studentIdNumber))}
          className="w-full"
          variant="chicago"
        >
          {uploading ? "Uploading..." : "Submit for Verification"}
        </Button>
      </CardContent>
    </Card>
  );
};