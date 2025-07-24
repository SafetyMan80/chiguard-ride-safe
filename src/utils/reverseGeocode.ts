// Reverse geocoding utility to convert GPS coordinates to human-readable location
interface GeocodeResult {
  city?: string;
  street?: string;
  neighborhood?: string;
  state?: string;
  country?: string;
}

export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  try {
    // Use OpenStreetMap Nominatim service (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'RailSafe-Transit-App'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();
    
    if (!data || !data.address) {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }

    const address = data.address;
    
    // Try to build a meaningful location description
    const parts: string[] = [];
    
    // Prefer road/street name if available
    if (address.road) {
      parts.push(address.road);
    } else if (address.pedestrian) {
      parts.push(address.pedestrian);
    } else if (address.footway) {
      parts.push(address.footway);
    }
    
    // Add neighborhood or area
    if (address.neighbourhood) {
      parts.push(address.neighbourhood);
    } else if (address.suburb) {
      parts.push(address.suburb);
    } else if (address.quarter) {
      parts.push(address.quarter);
    }
    
    // Add city/town
    if (address.city) {
      parts.push(address.city);
    } else if (address.town) {
      parts.push(address.town);
    } else if (address.village) {
      parts.push(address.village);
    }
    
    // If we have useful parts, join them
    if (parts.length > 0) {
      // Take the first 2 most relevant parts to keep it concise
      return parts.slice(0, 2).join(', ');
    }
    
    // Fallback to coordinates if we can't parse meaningful info
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    // Fallback to showing coordinates
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

// Cache to avoid repeated API calls for similar locations
const geocodeCache = new Map<string, string>();

export const getCachedLocationName = async (latitude: number, longitude: number): Promise<string> => {
  // Create a cache key with reduced precision to group nearby locations
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }
  
  const locationName = await reverseGeocode(latitude, longitude);
  geocodeCache.set(cacheKey, locationName);
  
  return locationName;
};
