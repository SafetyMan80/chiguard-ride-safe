import { useState } from "react";
import { Logo } from "@/components/Logo";
import { EmergencyButton } from "@/components/EmergencyButton";
import { IncidentReport } from "@/components/IncidentReport";
import { UniversityRides } from "@/components/UniversityRides";
import { CTASchedule } from "@/components/CTASchedule";
import { Settings } from "@/components/Settings";
import { TabNavigation } from "@/components/TabNavigation";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("emergency");
  const { toast } = useToast();

  const handleEmergencyActivated = () => {
    toast({
      title: "Emergency Alert Activated",
      description: "Your location has been shared and help is on the way.",
      variant: "destructive"
    });
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "emergency":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <EmergencyButton onEmergencyActivated={handleEmergencyActivated} />
            </div>
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Quick Report</h2>
              <IncidentReport />
            </div>
          </div>
        );
      case "incidents":
        return <IncidentReport />;
      case "groups":
        return <UniversityRides />;
      case "schedule":
        return <CTASchedule />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-b from-white to-chicago-accent border-b border-border/50 p-6 shadow-[var(--shadow-card)] safe-area-top">
        <div className="flex items-center justify-center gap-4">
          <Logo className="w-10 h-10 drop-shadow-md" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-chicago-blue to-chicago-navy bg-clip-text text-transparent tracking-tight">
            CHIGUARD
          </h1>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2 font-medium">
          Safety Driven...Community Powered
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 pb-24 max-w-md mx-auto w-full">
        {renderActiveTab()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border/50 shadow-[var(--shadow-floating)] safe-area-bottom">
        <div className="max-w-md mx-auto">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </nav>
    </div>
  );
};

export default Index;
