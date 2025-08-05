import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers not showing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Navigation className="w-5 h-5 text-primary" />
          {config.name} Transit Map
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-64 md:h-80 rounded-b-lg overflow-hidden">
          <MapContainer
            center={[config.center[1], config.center[0]]}
            zoom={12}
            className="w-full h-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[config.center[1], config.center[0]]}>
              <Popup>
                {config.name} Transit Center
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};