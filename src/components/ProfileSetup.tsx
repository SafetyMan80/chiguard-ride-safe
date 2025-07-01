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
  });
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUniversities();
    checkExistingProfile();
  }, []);

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
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const profileData = {
        user_id: user.id,
        email: user.email,
        ...formData,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData);

      if (error) throw error;

      toast({
        title: "Profile saved!",
        description: "Your profile has been created successfully.",
      });

      onProfileComplete();
    } catch (error: any) {
      toast({
        title: "Error",
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
              Please provide your information to continue with ChiGuard
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="student_status"
                checked={formData.student_status}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, student_status: checked as boolean }))
                }
              />
              <Label htmlFor="student_status">I am a student</Label>
            </div>

            {formData.student_status && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University *</Label>
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
                  <Label htmlFor="student_id">Student ID Number *</Label>
                  <Input
                    id="student_id"
                    value={formData.student_id_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, student_id_number: e.target.value }))}
                    required={formData.student_status}
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" variant="chicago" disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};