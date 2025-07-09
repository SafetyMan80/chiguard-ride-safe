import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, ArrowLeft } from "lucide-react";
import { MultiCityGroupRides } from "@/components/MultiCityGroupRides";
import { GeneralGroupRides } from "@/components/GeneralGroupRides";
import { useLanguage } from "@/hooks/useLanguage";

export const GroupRideSelector = () => {
  const [selectedType, setSelectedType] = useState<'student' | 'general' | null>(null);
  const { t } = useLanguage();

  if (selectedType === 'student') {
    return (
      <div className="space-y-4">
        <Button 
          onClick={() => setSelectedType(null)}
          variant="ghost" 
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("Back to Group Options")}
        </Button>
        <MultiCityGroupRides />
      </div>
    );
  }

  if (selectedType === 'general') {
    return (
      <div className="space-y-4">
        <Button 
          onClick={() => setSelectedType(null)}
          variant="ghost" 
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("Back to Group Options")}
        </Button>
        <GeneralGroupRides />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Users className="w-5 h-5" />
            {t("Choose Your Group Type")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {t("Select the type of group ride you'd like to join or create")}
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={() => setSelectedType('student')}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-chicago-light-blue/10 border-chicago-blue/20"
            >
              <GraduationCap className="w-8 h-8 text-chicago-blue" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">{t("Student Rides")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("University-verified student group rides")}
                </p>
              </div>
            </Button>
            
            <Button
              onClick={() => setSelectedType('general')}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-muted/50"
            >
              <Users className="w-8 h-8 text-primary" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">{t("General Rides")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("Open to all verified community members")}
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};