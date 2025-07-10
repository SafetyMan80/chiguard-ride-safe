// City detection based on GPS coordinates
import { getTransitSystemFromCity } from './transitSystemDetection';

interface CityBounds {
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// Major US cities with their approximate boundaries
const CITY_BOUNDARIES: CityBounds[] = [
  {
    name: 'chicago',
    bounds: { north: 42.0, south: 41.6, east: -87.5, west: -87.9 }
  },
  {
    name: 'nyc',
    bounds: { north: 40.9, south: 40.4, east: -73.7, west: -74.3 }
  },
  {
    name: 'washington_dc',
    bounds: { north: 39.0, south: 38.8, east: -76.9, west: -77.2 }
  },
  {
    name: 'atlanta',
    bounds: { north: 33.9, south: 33.6, east: -84.2, west: -84.7 }
  },
  {
    name: 'philadelphia',
    bounds: { north: 40.1, south: 39.9, east: -74.9, west: -75.3 }
  },
  {
    name: 'denver',
    bounds: { north: 39.8, south: 39.6, east: -104.8, west: -105.1 }
  },
  {
    name: 'los_angeles',
    bounds: { north: 34.3, south: 33.7, east: -118.1, west: -118.7 }
  },
  {
    name: 'san_francisco',
    bounds: { north: 37.8, south: 37.7, east: -122.3, west: -122.5 }
  },
  {
    name: 'boston',
    bounds: { north: 42.4, south: 42.2, east: -70.9, west: -71.2 }
  },
  {
    name: 'seattle',
    bounds: { north: 47.7, south: 47.5, east: -122.2, west: -122.4 }
  },
  {
    name: 'portland',
    bounds: { north: 45.6, south: 45.4, east: -122.5, west: -122.8 }
  },
  {
    name: 'miami',
    bounds: { north: 25.9, south: 25.7, east: -80.1, west: -80.3 }
  }
];

export const detectCityFromCoordinates = (latitude: number, longitude: number): string | null => {
  for (const city of CITY_BOUNDARIES) {
    const { bounds } = city;
    
    if (
      latitude >= bounds.south &&
      latitude <= bounds.north &&
      longitude >= bounds.west &&
      longitude <= bounds.east
    ) {
      return city.name;
    }
  }
  
  return null;
};

export const getTransitSystemFromCoordinates = (latitude: number, longitude: number): string => {
  const detectedCity = detectCityFromCoordinates(latitude, longitude);
  return getTransitSystemFromCity(detectedCity);
};