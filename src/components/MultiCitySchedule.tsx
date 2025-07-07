import { useState } from "react";
import { CitySelector } from "./CitySelector";
import { CityScheduleWrapper } from "./CityScheduleWrapper";

export const MultiCitySchedule = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const handleCitySelect = (cityId: string, available: boolean) => {
    if (available) {
      setSelectedCity(cityId);
    }
  };

  const handleBackToSelection = () => {
    setSelectedCity(null);
  };

  if (selectedCity) {
    return (
      <CityScheduleWrapper 
        cityId={selectedCity} 
        onBack={handleBackToSelection} 
      />
    );
  }

  return <CitySelector onCitySelect={handleCitySelect} />;
};