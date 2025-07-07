import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, ArrowLeft } from "lucide-react";
import { MultiCityGroupRides } from "@/components/MultiCityGroupRides";
import { GeneralGroupRides } from "@/components/GeneralGroupRides";

export const GroupRideSelector = () => {
  const [selectedType, setSelectedType] = useState<'student' | 'general' | null>(null);

  if (selectedType === 'student') {
    return (
      <div className="space-y-4">
        <Button 
          onClick={() => setSelectedType(null)}
          variant="ghost" 
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Group Options
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
          Back to Group Options
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
            Choose Your Group Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Select the type of group ride you'd like to join or create
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={() => setSelectedType('student')}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-chicago-light-blue/10 border-chicago-blue/20"
            >
              <GraduationCap className="w-8 h-8 text-chicago-blue" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">Student Rides</h3>
                <p className="text-sm text-muted-foreground">
                  University-verified student group rides
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
                <h3 className="font-semibold text-lg">General Rides</h3>
                <p className="text-sm text-muted-foreground">
                  Open to all verified community members
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};