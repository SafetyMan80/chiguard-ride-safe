import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MTASchedule } from "./MTASchedule";
import { CTASchedule } from "./CTASchedule";
import { WMATASchedule } from "./WMATASchedule";
import { RTDSchedule } from "./RTDSchedule";
import { SEPTASchedule } from "./SEPTASchedule";
import { MARTASchedule } from "./MARTASchedule";
import { LAMetroSchedule } from "./LAMetroSchedule";
import { MBTASchedule } from "./MBTASchedule";
import { SF511Schedule } from "./SF511Schedule";

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
      case "boston":
        return <MBTASchedule />;
      case "san_francisco":
        return <SF511Schedule onBack={onBack} />;
      default:
        return <div>Schedule not available</div>;
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-4">
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