import React from 'react';
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
  },
  nyc: {
    name: "New York City", 
    center: [-73.9857, 40.7484] as [number, number],
  },
  denver: {
    name: "Denver",
    center: [-104.9903, 39.7392] as [number, number], 
  },
  washington_dc: {
    name: "Washington D.C.",
    center: [-77.0369, 38.9072] as [number, number],
  },
  philadelphia: {
    name: "Philadelphia", 
    center: [-75.1652, 39.9526] as [number, number],
  },
  atlanta: {
    name: "Atlanta",
    center: [-84.3880, 33.7490] as [number, number],
  },
  los_angeles: {
    name: "Los Angeles",
    center: [-118.2437, 34.0522] as [number, number],
  },
  boston: {
    name: "Boston",
    center: [-71.0589, 42.3601] as [number, number],
  },
  san_francisco: {
    name: "San Francisco",
    center: [-122.4194, 37.7749] as [number, number],
  }
};

export const CityMap = ({ cityId, className = "" }: CityMapProps) => {
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

  // Use a different approach - direct map with mapbox or leaflet integration
  // For now, let's try a different Google Maps approach that should work better
  const mapUrl = `https://maps.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO6X0JQm1QFJ7M&q=${config.center[1]},${config.center[0]}&zoom=12`;
  
  // Fallback to a simple static map image if iframe doesn't work
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${config.center[1]},${config.center[0]}&zoom=12&size=600x400&markers=color:red|${config.center[1]},${config.center[0]}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO6X0JQm1QFJ7M`;

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Navigation className="w-5 h-5 text-chicago-blue" />
          {config.name} Transit Map
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full h-64 md:h-80 bg-muted rounded-b-lg overflow-hidden">
          <img
            src={staticMapUrl}
            alt={`${config.name} Transit Map`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // If the image fails to load, show a fallback
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Map temporarily unavailable</p>
              <p className="text-xs mt-1">{config.name} - {config.center[1]}, {config.center[0]}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};