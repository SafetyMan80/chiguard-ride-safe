import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { sanitizeInput, validateLocation } from "@/lib/security";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";

interface University {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface ProfileSetupProps {
  onProfileComplete: () => void;
  onBack?: () => void;
}

export const ProfileSetup = ({ onProfileComplete, onBack }: ProfileSetupProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    date_of_birth: "",
    address: "",
    student_status: false,
    university_name: "",
    student_id_number: "",
    is_public_profile: true,
    profile_photo_url: "",
  });
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailVerification, setEmailVerification] = useState<{
    isValidated: boolean;
    universityName: string | null;
    message: string;
  }>({ isValidated: false, universityName: null, message: "" });
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchUniversities();
    checkExistingProfile();
    checkEmailVerification();
  }, []);

  const checkEmailVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;

    // Check if user's email domain matches a university
    const { data, error } = await supabase
      .rpc('validate_university_email', { email_address: user.email });

    if (error) {
      console.error("Error validating email:", error);
      return;
    }

    if (data && data.length > 0 && data[0].is_student_email) {
      setEmailVerification({
        isValidated: true,
        universityName: data[0].university_name,
        message: `Your email is verified with ${data[0].university_name}!`
      });
      
      // Auto-set university and student status if verified
      if (!formData.university_name || !formData.student_status) {
        setFormData(prev => ({ 
          ...prev, 
          university_name: data[0].university_name,
          student_status: true
        }));
      }
    } else {
      setEmailVerification({
        isValidated: false,
        universityName: null,
        message: formData.student_status 
          ? "Your email domain doesn't match a supported university. You can still mark yourself as a student and provide verification later."
          : "Email domain verified for general use. University verification available if you select student status."
      });
    }
  };

  const fetchUniversities = async () => {
    const { data, error } = await supabase
      .from("universities")
      .select("*")
      .order("name");

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching universities:", error);
      }
    } else {
      setUniversities(data || []);
    }
  };

  const checkExistingProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error checking profile:", error);
      }
    } else if (data) {
      setFormData({
        full_name: data.full_name || "",
        phone_number: data.phone_number || "",
        date_of_birth: data.date_of_birth || "",
        address: data.address || "",
        student_status: data.student_status || false,
        university_name: data.university_name || "",
        student_id_number: data.student_id_number || "",
        is_public_profile: data.is_public_profile ?? true,
        profile_photo_url: data.profile_photo_url || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Validate required fields
      if (!formData.full_name.trim() || !formData.phone_number.trim() || 
          !formData.date_of_birth || !formData.address.trim()) {
        throw new Error("Please fill in all required fields");
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^\+?[\d\s\-\(\)\.]{10,}$/;
      if (!phoneRegex.test(formData.phone_number)) {
        throw new Error("Please enter a valid phone number");
      }

      // Validate date of birth (must be at least 13 years old)
      const dob = new Date(formData.date_of_birth);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 13);
      if (dob > minAge) {
        throw new Error("You must be at least 13 years old to use this service");
      }

      // Sanitize all text inputs
      const sanitizedData = {
        full_name: sanitizeInput(formData.full_name),
        phone_number: sanitizeInput(formData.phone_number),
        date_of_birth: formData.date_of_birth,
        address: sanitizeInput(formData.address),
        student_status: formData.student_status,
        university_name: formData.student_status ? sanitizeInput(formData.university_name) : null,
        student_id_number: formData.student_status ? sanitizeInput(formData.student_id_number) : null,
        is_public_profile: formData.is_public_profile,
      };

      const profileData = {
        user_id: user.id,
        email: user.email,
        ...sanitizedData,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: t("Profile saved!"),
        description: t("Your profile has been created successfully."),
      });

      onProfileComplete();
    } catch (error: any) {
      toast({
        title: t("Error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Please provide your information to continue with RailSafe
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <ProfilePhotoUpload
            currentPhotoUrl={formData.profile_photo_url}
            onPhotoUpdate={(url) => setFormData(prev => ({ ...prev, profile_photo_url: url || "" }))}
            userName={formData.full_name}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St, Chicago, IL 60601"
                required
              />
            </div>
          </div>

          {/* Email Verification Status */}
          {emailVerification.message && (
            <div className={`rounded-lg p-4 ${
              emailVerification.isValidated 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                  emailVerification.isValidated ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {emailVerification.isValidated ? (
                    <span className="text-green-600 text-xs">✓</span>
                  ) : (
                    <span className="text-yellow-600 text-xs">!</span>
                  )}
                </div>
                <div>
                  <p className={`font-medium ${
                    emailVerification.isValidated ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {emailVerification.isValidated ? 'Email Verified' : 'Email Not Verified'}
                  </p>
                  <p className={`text-sm ${
                    emailVerification.isValidated ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {emailVerification.message}
                  </p>
                  {!emailVerification.isValidated && (
                    <p className="text-xs text-muted-foreground mt-1">
                      To get instant verification, sign up with your university email (e.g., @uchicago.edu, @northwestern.edu)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="student_status"
                checked={formData.student_status}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ ...prev, student_status: checked as boolean }));
                  // Update email verification message when student status changes
                  setTimeout(() => checkEmailVerification(), 100);
                }}
              />
              <Label htmlFor="student_status">
                I am a student {emailVerification.isValidated && '(automatically verified via email)'}
              </Label>
            </div>

            {formData.student_status && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Select
                      value={formData.university_name}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, university_name: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your university" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((university) => (
                          <SelectItem key={university.id} value={university.name}>
                            {university.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student_id">Student ID Number</Label>
                    <Input
                      id="student_id"
                      value={formData.student_id_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, student_id_number: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> {emailVerification.isValidated 
                      ? 'Your student status is automatically verified via your university email domain.'
                      : 'Additional verification may be required for university group rides if your email domain isn\'t recognized.'
                    }
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Profile Visibility */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public_profile"
                checked={formData.is_public_profile}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_public_profile: checked as boolean }))
                }
              />
              <Label htmlFor="is_public_profile">
                Make my profile public
              </Label>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> {formData.is_public_profile 
                  ? 'Your profile will be visible to other users when creating or joining rides.'
                  : 'You must have a public profile to create or join group rides. You can change this setting later.'
                }
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" variant="chicago" disabled={loading}>
            {loading ? t("Saving...") : t("Save Profile")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};