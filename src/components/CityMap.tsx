import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";

interface CityMapProps {
  cityId: string;
  className?: string;
}

// City configurations with appropriate zoom levels and center points
const CITY_CONFIGS = {
  chicago: {
    name: "Chicago",
    center: [-87.6298, 41.8781] as [number, number],
    zoom: 10,
    style: 'mapbox://styles/mapbox/light-v11'
  },
  nyc: {
    name: "New York City", 
    center: [-73.9857, 40.7484] as [number, number],
    zoom: 10,
    style: 'mapbox://styles/mapbox/light-v11'
  },
  denver: {
    name: "Denver",
    center: [-104.9903, 39.7392] as [number, number], 
    zoom: 10,
    style: 'mapbox://styles/mapbox/light-v11'
  },
  washington_dc: {
    name: "Washington D.C.",
    center: [-77.0369, 38.9072] as [number, number],
    zoom: 11,
    style: 'mapbox://styles/mapbox/light-v11'
  },
  philadelphia: {
    name: "Philadelphia", 
    center: [-75.1652, 39.9526] as [number, number],
    zoom: 10,
    style: 'mapbox://styles/mapbox/light-v11'
  },
  atlanta: {
    name: "Atlanta",
    center: [-84.3880, 33.7490] as [number, number],
    zoom: 10,
    style: 'mapbox://styles/mapbox/light-v11'
  },
  los_angeles: {
    name: "Los Angeles",
    center: [-118.2437, 34.0522] as [number, number],
    zoom: 9,
    style: 'mapbox://styles/mapbox/light-v11'
  },
  boston: {
    name: "Boston",
    center: [-71.0589, 42.3601] as [number, number],
    zoom: 11,
    style: 'mapbox://styles/mapbox/light-v11'
  },
  san_francisco: {
    name: "San Francisco",
    center: [-122.4194, 37.7749] as [number, number],
    zoom: 11,
    style: 'mapbox://styles/mapbox/light-v11'
  }
};

export const CityMap = ({ cityId, className = "" }: CityMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const config = CITY_CONFIGS[cityId as keyof typeof CITY_CONFIGS];
    if (!config) return;

    // Show static map information with city details
    if (mapContainer.current) {
      mapContainer.current.innerHTML = `
        <div class="flex items-center justify-center h-full bg-gradient-to-br from-chicago-blue/5 to-chicago-blue/10 rounded-lg border border-chicago-blue/20">
          <div class="text-center p-6">
            <div class="w-16 h-16 mx-auto mb-4 bg-chicago-blue/10 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-chicago-blue" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <h3 class="font-bold text-xl mb-2 text-chicago-blue">${config.name}</h3>
            <p class="text-sm text-muted-foreground mb-3">Transit System Hub</p>
            <div class="bg-white/50 rounded-lg p-3 text-xs">
              <p class="font-medium">Location:</p>
              <p>${config.center[1].toFixed(4)}°N, ${Math.abs(config.center[0]).toFixed(4)}°W</p>
            </div>
          </div>
        </div>
      `;
    }
  }, [cityId]);

  const config = CITY_CONFIGS[cityId as keyof typeof CITY_CONFIGS];
  if (!config) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2" />
            <p>Map not available for this city</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Navigation className="w-5 h-5 text-chicago-blue" />
          {config.name} Transit Map
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapContainer} 
          className="w-full h-64 md:h-80 bg-muted/20"
          style={{ position: 'relative' }}
        />
      </CardContent>
    </Card>
  );
};