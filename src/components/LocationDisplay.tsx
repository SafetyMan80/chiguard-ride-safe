import { useState, useEffect } from 'react';
import { getCachedLocationName } from '@/utils/reverseGeocode';

interface LocationDisplayProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  showAccuracy?: boolean;
}

export const LocationDisplay = ({ 
  latitude, 
  longitude, 
  accuracy, 
  showAccuracy = true 
}: LocationDisplayProps) => {
  const [locationName, setLocationName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getLocation = async () => {
      setIsLoading(true);
      try {
        const name = await getCachedLocationName(latitude, longitude);
        setLocationName(name);
      } catch (error) {
        console.warn('Failed to get location name:', error);
        setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (latitude && longitude) {
      getLocation();
    }
  }, [latitude, longitude]);

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground">
        📍 Locating...
      </div>
    );
  }

  return (
    <div className="text-xs text-muted-foreground">
      📍 Incident reported near {locationName}
      {showAccuracy && accuracy && ` (±${Math.round(accuracy)}m)`}
    </div>
  );
};