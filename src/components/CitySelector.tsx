import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Train } from "lucide-react";
import { CITIES_WITH_RAIL } from "@/data/cities";
import { CityCard } from "./CityCard";

interface CitySelectorProps {
  onCitySelect: (cityId: string, available: boolean) => void;
}

export const CitySelector = ({ onCitySelect }: CitySelectorProps) => {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CITIES_WITH_RAIL.map((city) => (
              <CityCard 
                key={city.id} 
                city={city} 
                onCitySelect={onCitySelect} 
              />
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
              <strong>🚊 Currently Available:</strong> Chicago CTA, New York City MTA, Denver RTD, Washington D.C. Metro, Atlanta MARTA, and Boston MBTA with 
              real-time schedules, station search, and system information.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>🚧 Coming Soon:</strong> Real-time integration for Philadelphia SEPTA and LA Metro with the same features.
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