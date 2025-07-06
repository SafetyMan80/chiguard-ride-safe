import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Train, ArrowLeft } from "lucide-react";
import { MTASchedule } from "./MTASchedule";
import { CTASchedule } from "./CTASchedule";

interface City {
  id: string;
  name: string;
  agency: string;
  description: string;
  railLines: string[];
  color: string;
  available: boolean;
}

const CITIES_WITH_RAIL: City[] = [
  {
    id: "chicago",
    name: "Chicago",
    agency: "CTA (Chicago Transit Authority)",
    description: "L Train System - 8 color-coded lines",
    railLines: ["Red", "Blue", "Brown", "Green", "Orange", "Pink", "Purple", "Yellow"],
    color: "bg-chicago-blue",
    available: true
  },
  {
    id: "nyc",
    name: "New York City",
    agency: "MTA (Metropolitan Transportation Authority)",
    description: "Subway System - Multiple numbered and lettered lines",
    railLines: ["4", "5", "6", "7", "A", "B", "C", "D", "E", "F", "G", "J", "L", "M", "N", "Q", "R", "W", "Z"],
    color: "bg-blue-600",
    available: true
  },
  {
    id: "los_angeles",
    name: "Los Angeles",
    agency: "LA Metro",
    description: "Metro Rail System - Light rail and subway lines",
    railLines: ["Red", "Purple", "Blue", "Green", "Gold", "Expo"],
    color: "bg-red-600",
    available: false
  },
  {
    id: "washington_dc",
    name: "Washington D.C.",
    agency: "WMATA (Washington Metropolitan Area Transit Authority)",
    description: "Metrorail System - 6 color-coded lines",
    railLines: ["Red", "Blue", "Orange", "Silver", "Green", "Yellow"],
    color: "bg-blue-800",
    available: false
  },
  {
    id: "philadelphia",
    name: "Philadelphia",
    agency: "SEPTA (Southeastern Pennsylvania Transportation Authority)",
    description: "Regional Rail and Subway System",
    railLines: ["Market-Frankford", "Broad Street", "Regional Rail"],
    color: "bg-purple-600",
    available: false
  },
  {
    id: "atlanta",
    name: "Atlanta",
    agency: "MARTA (Metropolitan Atlanta Rapid Transit Authority)",
    description: "Heavy Rail System - 4 colored lines",
    railLines: ["Red", "Gold", "Blue", "Green"],
    color: "bg-orange-600",
    available: false
  }
];

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

  // If Chicago is selected, show the existing CTA schedule
  if (selectedCity === "chicago") {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={handleBackToSelection}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to City Selection
        </Button>
        <CTASchedule />
      </div>
    );
  }

  // If NYC is selected, show the MTA schedule
  if (selectedCity === "nyc") {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={handleBackToSelection}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to City Selection
        </Button>
        <MTASchedule />
      </div>
    );
  }

  // Show city selection interface
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Train className="w-5 h-5" />
            Rail Transit Schedules
          </CardTitle>
          <CardDescription>
            Select a city to view real-time rail schedules and station information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CITIES_WITH_RAIL.map((city) => (
              <Card
                key={city.id}
                className={`cursor-pointer transition-all duration-200 ${
                  city.available
                    ? "hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary/20"
                    : "opacity-60 cursor-not-allowed"
                }`}
                onClick={() => handleCitySelect(city.id, city.available)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${city.color}`} />
                      <div>
                        <h3 className="font-bold text-lg">{city.name}</h3>
                        <p className="text-sm text-muted-foreground">{city.agency}</p>
                      </div>
                    </div>
                    {city.available ? (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        Available
                      </div>
                    ) : (
                      <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                        Coming Soon
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {city.description}
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Rail Lines:</p>
                    <div className="flex flex-wrap gap-1">
                      {city.railLines.slice(0, 6).map((line, index) => (
                        <span
                          key={index}
                          className="bg-muted px-2 py-1 rounded text-xs font-medium"
                        >
                          {line}
                        </span>
                      ))}
                      {city.railLines.length > 6 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{city.railLines.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            About Multi-City Rail Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🚊 Currently Available:</strong> Chicago CTA and New York City MTA with 
              real-time schedules, station search, and system information.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>🚧 Coming Soon:</strong> Real-time integration for LA Metro, 
              DC Metro, SEPTA, and MARTA with the same features.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Features for Each City:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Real-time arrival predictions</li>
              <li>• Interactive system maps</li>
              <li>• Station search and stop IDs</li>
              <li>• Service alerts and delays</li>
              <li>• Route information and schedules</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};