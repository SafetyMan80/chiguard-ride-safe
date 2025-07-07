import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MTASchedule } from "./MTASchedule";
import { CTASchedule } from "./CTASchedule";
import { WMATASchedule } from "./WMATASchedule";
import { RTDSchedule } from "./RTDSchedule";
import { SEPTASchedule } from "./SEPTASchedule";
import { MARTASchedule } from "./MARTASchedule";
import { LAMetroSchedule } from "./LAMetroSchedule";

interface CityScheduleWrapperProps {
  cityId: string;
  onBack: () => void;
}

export const CityScheduleWrapper = ({ cityId, onBack }: CityScheduleWrapperProps) => {
  const renderScheduleComponent = () => {
    switch (cityId) {
      case "chicago":
        return <CTASchedule />;
      case "nyc":
        return <MTASchedule />;
      case "denver":
        return <RTDSchedule />;
      case "washington_dc":
        return <WMATASchedule />;
      case "philadelphia":
        return <SEPTASchedule />;
      case "atlanta":
        return <MARTASchedule />;
      case "los_angeles":
        return <LAMetroSchedule />;
      default:
        return <div>Schedule not available</div>;
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={onBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to City Selection
      </Button>
      {renderScheduleComponent()}
    </div>
  );
};