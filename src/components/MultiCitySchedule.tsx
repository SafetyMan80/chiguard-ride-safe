import { useState } from "react";
import { CitySelector } from "./CitySelector";
import { CityScheduleWrapper } from "./CityScheduleWrapper";
import { ErrorBoundary } from "./ErrorBoundary";
import { ScheduleLoadingSkeleton } from "./LoadingStates";
import { CTADebugTester } from "./CTADebugTester";

export const MultiCitySchedule = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  console.log('🏙️ MultiCitySchedule rendered with selectedCity:', selectedCity);

  const handleCitySelect = (cityId: string, available: boolean) => {
    console.log('🏙️ City selected:', cityId, 'available:', available);
    if (available) {
      setSelectedCity(cityId);
    }
  };

  const handleBackToSelection = () => {
    setSelectedCity(null);
  };

  if (selectedCity) {
    return (
      <ErrorBoundary fallback={({ retry }) => (
        <div className="text-center p-6">
          <p className="text-destructive mb-4">Failed to load schedule</p>
          <button onClick={retry} className="text-chicago-blue hover:underline">
            Try again
          </button>
        </div>
      )}>
        <CityScheduleWrapper 
          cityId={selectedCity} 
          onBack={handleBackToSelection} 
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <CTADebugTester />
        <CitySelector onCitySelect={handleCitySelect} />
      </div>
    </ErrorBoundary>
  );
};