import { useState, useEffect } from "react";
import { CitySelector } from "./CitySelector";
import { CityScheduleWrapper } from "./CityScheduleWrapper";
import { ErrorBoundary } from "./ErrorBoundary";
import { ScheduleLoadingSkeleton } from "./LoadingStates";
import { useLanguage } from "@/hooks/useLanguage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const MultiCitySchedule = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(true);
  const { t } = useLanguage();

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
          <p className="text-destructive mb-4">{t("Failed to load schedule")}</p>
          <button onClick={retry} className="text-chicago-blue hover:underline">
            {t("Try again")}
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
      <div className="space-y-6 max-w-6xl mx-auto px-4">
        <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                ⚠️ Schedule Disclaimer
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Schedule feature is not guaranteed to be accurate and is meant to be used as a general guide to routes and timing. For most accurate schedule information go to that specific city's commuter website.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowWarning(false)}>
                I Understand
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <CitySelector onCitySelect={handleCitySelect} />
      </div>
    </ErrorBoundary>
  );
};