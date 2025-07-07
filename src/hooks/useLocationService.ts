import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  state?: string;
  country?: string;
}

interface CityBounds {
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
}

// Define major transit cities with their geographic boundaries
const TRANSIT_CITIES: CityBounds[] = [
  {
    name: 'chicago',
    bounds: { north: 42.023, south: 41.644, east: -87.524, west: -87.940 },
    center: { lat: 41.8781, lng: -87.6298 }
  },
  {
    name: 'nyc',
    bounds: { north: 40.917, south: 40.477, east: -73.700, west: -74.259 },
    center: { lat: 40.7128, lng: -74.0060 }
  },
  {
    name: 'washington_dc',
    bounds: { north: 39.000, south: 38.801, east: -76.910, west: -77.120 },
    center: { lat: 38.9072, lng: -77.0369 }
  },
  {
    name: 'atlanta',
    bounds: { north: 33.887, south: 33.647, east: -84.290, west: -84.551 },
    center: { lat: 33.7490, lng: -84.3880 }
  },
  {
    name: 'philadelphia',
    bounds: { north: 40.138, south: 39.867, east: -74.956, west: -75.280 },
    center: { lat: 39.9526, lng: -75.1652 }
  },
  {
    name: 'denver',
    bounds: { north: 39.914, south: 39.614, east: -104.600, west: -105.109 },
    center: { lat: 39.7392, lng: -104.9903 }
  }
];

export const useLocationService = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'>('prompt');
  const { toast } = useToast();

  const checkLocationPermissions = async () => {
    try {
      const permissions = await Geolocation.checkPermissions();
      setPermissionStatus(permissions.location);
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  };

  const requestLocationPermissions = async () => {
    try {
      const permissions = await Geolocation.requestPermissions();
      setPermissionStatus(permissions.location);
      
      if (permissions.location === 'granted') {
        toast({
          title: "Location Access Granted",
          description: "You'll receive incident alerts for your city"
        });
        return true;
      } else {
        toast({
          title: "Location Access Denied", 
          description: "You'll receive all incident alerts regardless of location",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      toast({
        title: "Location Error",
        description: "Unable to access location services",
        variant: "destructive"
      });
      return false;
    }
  };

  const determineCity = (lat: number, lng: number): string | null => {
    // Check if coordinates fall within any transit city bounds
    for (const city of TRANSIT_CITIES) {
      const { bounds } = city;
      if (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
      ) {
        return city.name;
      }
    }

    // If not in a transit city, find the closest one
    let closestCity = null;
    let minDistance = Infinity;

    for (const city of TRANSIT_CITIES) {
      const distance = Math.sqrt(
        Math.pow(lat - city.center.lat, 2) + Math.pow(lng - city.center.lng, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city.name;
      }
    }

    // Only return closest city if within reasonable distance (about 50 miles)
    return minDistance < 0.7 ? closestCity : null;
  };

  const getCurrentLocation = useCallback(async (options = {}) => {
    setLoading(true);
    
    try {
      // Check permissions first
      const hasPermission = await checkLocationPermissions();
      if (!hasPermission) {
        const granted = await requestLocationPermissions();
        if (!granted) {
          setLoading(false);
          return null;
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        ...options
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      // Determine which transit city the user is in/near
      const detectedCity = determineCity(locationData.latitude, locationData.longitude);
      
      if (detectedCity) {
        setUserCity(detectedCity);
        locationData.city = detectedCity;
        
        toast({
          title: "Location Detected",
          description: `You'll receive ${getCityDisplayName(detectedCity)} transit alerts`,
        });
      } else {
        setUserCity(null);
        toast({
          title: "Location Detected",
          description: "You'll receive alerts for all transit systems",
        });
      }

      setLocation(locationData);
      return locationData;
      
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      let errorMessage = "Unable to get your location";
      if (error.message?.includes('timeout')) {
        errorMessage = "Location request timed out - please try again";
      } else if (error.message?.includes('denied')) {
        errorMessage = "Location access denied";
      }
      
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const watchLocation = useCallback(async (callback: (location: LocationData) => void) => {
    try {
      const hasPermission = await checkLocationPermissions();
      if (!hasPermission) {
        const granted = await requestLocationPermissions();
        if (!granted) return null;
      }

      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000, // 1 minute
        },
        (position) => {
          if (position) {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            };

            const detectedCity = determineCity(locationData.latitude, locationData.longitude);
            if (detectedCity) {
              locationData.city = detectedCity;
              setUserCity(detectedCity);
            }

            setLocation(locationData);
            callback(locationData);
          }
        }
      );

      return watchId;
    } catch (error) {
      console.error('Error watching location:', error);
      return null;
    }
  }, []);

  const clearWatch = async (watchId: string) => {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error clearing location watch:', error);
    }
  };

  const getCityDisplayName = (cityId: string): string => {
    const cityNames: { [key: string]: string } = {
      'chicago': 'Chicago CTA',
      'nyc': 'NYC MTA',
      'washington_dc': 'DC Metro',
      'atlanta': 'Atlanta MARTA',
      'philadelphia': 'Philadelphia SEPTA',
      'denver': 'Denver RTD'
    };
    return cityNames[cityId] || cityId;
  };

  // Initialize location on mount
  useEffect(() => {
    checkLocationPermissions();
  }, []);

  return {
    location,
    userCity,
    loading,
    permissionStatus,
    getCurrentLocation,
    watchLocation,
    clearWatch,
    requestLocationPermissions,
    getCityDisplayName
  };
};