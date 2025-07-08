import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, ArrowLeft } from "lucide-react";
import { IncidentReport } from "./IncidentReport";
import { FailsafeIncidentReports } from "./FailsafeIncidentReports";
import { CitySelectionSkeleton } from "./LoadingSkeleton";
import { ErrorBoundary } from "./ErrorBoundary";
import { IncidentTestRunner } from "./testing/IncidentTestRunner";
import { supabase } from "@/integrations/supabase/client";

interface City {
  id: string;
  name: string;
  agency: string;
  description: string;
  railLines: string[];
  color: string;
  available: boolean;
  majorStations: string[];
}

const CITIES_WITH_RAIL: City[] = [
  // Available Cities - Data Available
  {
    id: "chicago",
    name: "Chicago",
    agency: "CTA (Chicago Transit Authority)",
    description: "L Train System - 8 color-coded lines",
    railLines: ["Red", "Blue", "Brown", "Green", "Orange", "Pink", "Purple", "Yellow"],
    color: "bg-chicago-blue",
    available: true,
    majorStations: ["Union Station", "Millennium Station", "LaSalle Street Station", "Ogilvie Transportation Center", "Roosevelt", "Clark/Lake", "Jackson", "Monroe"]
  },
  {
    id: "nyc",
    name: "New York City",
    agency: "MTA (Metropolitan Transportation Authority)",
    description: "Subway System - Multiple numbered and lettered lines",
    railLines: ["4", "5", "6", "7", "A", "B", "C", "D", "E", "F", "G", "J", "L", "M", "N", "Q", "R", "W", "Z"],
    color: "bg-blue-600",
    available: true,
    majorStations: ["Times Square-42nd St", "Grand Central-42nd St", "Union Square-14th St", "Penn Station-34th St", "Atlantic Terminal", "14th St-Union Sq", "42nd St-Port Authority"]
  },
  {
    id: "denver",
    name: "Denver",
    agency: "RTD (Regional Transportation District)",
    description: "Light Rail & Commuter Rail - Multiple lettered lines",
    railLines: ["A Line", "B Line", "C Line", "D Line", "E Line", "F Line", "G Line", "H Line", "N Line", "R Line", "W Line"],
    color: "bg-green-700",
    available: true,
    majorStations: ["Union Station", "Downtown-Littleton", "Denver International Airport", "Westminster", "Lakewood", "Thornton"]
  },
  {
    id: "washington_dc",
    name: "Washington D.C.",
    agency: "WMATA (Washington Metropolitan Area Transit Authority)",
    description: "Metrorail System - 6 color-coded lines",
    railLines: ["Red", "Blue", "Orange", "Silver", "Green", "Yellow"],
    color: "bg-blue-800",
    available: true,
    majorStations: ["Union Station", "Gallery Pl-Chinatown", "Metro Center", "L'Enfant Plaza", "Dupont Circle", "Rosslyn"]
  },
  {
    id: "philadelphia",
    name: "Philadelphia",
    agency: "SEPTA (Southeastern Pennsylvania Transportation Authority)",
    description: "Regional Rail and Subway System - Market-Frankford and Broad Street Lines",
    railLines: ["Market-Frankford Line", "Broad Street Line", "Regional Rail"],
    color: "bg-purple-600",
    available: true,
    majorStations: ["30th Street Station", "Suburban Station", "Jefferson Station", "Temple University", "City Hall", "Broad St-Pattison"]
  },
  {
    id: "atlanta",
    name: "Atlanta",
    agency: "MARTA (Metropolitan Atlanta Rapid Transit Authority)",
    description: "Heavy Rail System - 4 colored lines",
    railLines: ["Red", "Gold", "Blue", "Green"],
    color: "bg-orange-600",
    available: true,
    majorStations: ["Five Points", "Peachtree Center", "Airport", "Lindbergh Center", "North Springs", "Decatur", "King Memorial", "West End", "Buckhead", "Midtown"]
  },
  {
    id: "boston",
    name: "Boston",
    agency: "MBTA (Massachusetts Bay Transportation Authority)",
    description: "Subway System - Red, Blue, Orange, Green, and Silver Lines",
    railLines: ["Red", "Blue", "Orange", "Green-B", "Green-C", "Green-D", "Green-E", "Silver"],
    color: "bg-blue-700",
    available: true,
    majorStations: ["South Station", "North Station", "Back Bay", "Downtown Crossing", "Park Street", "Government Center", "Harvard", "MIT/Kendall"]
  },
  {
    id: "san_francisco",
    name: "San Francisco",
    agency: "BART & MUNI (Bay Area Rapid Transit & San Francisco Municipal Transportation)",
    description: "BART Heavy Rail & MUNI Light Rail Systems",
    railLines: ["BART Red", "BART Blue", "BART Green", "BART Yellow", "MUNI N", "MUNI T", "MUNI K", "MUNI L", "MUNI M", "MUNI J"],
    color: "bg-purple-600",
    available: true,
    majorStations: ["Powell St", "Montgomery St", "Embarcadero", "Civic Center", "16th St Mission", "24th St Mission", "Balboa Park", "Daly City"]
  },
  // Coming Soon Cities
  {
    id: "los_angeles",
    name: "Los Angeles",
    agency: "LA Metro",
    description: "Metro Rail System - Light rail and subway lines",
    railLines: ["Red", "Purple", "Blue", "Green", "Gold", "Expo"],
    color: "bg-red-600",
    available: false,
    majorStations: ["Union Station", "7th St/Metro Center", "Hollywood/Highland", "Westlake/MacArthur Park", "North Hollywood", "Long Beach"]
  }
];

export const MultiCityIncidentReport = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        if (!error && data) {
          setIsAdmin(true);
        }
      }
    };
    
    checkAdminStatus();
  }, []);

  const handleCitySelect = (cityId: string, available: boolean) => {
    if (available) {
      setSelectedCity(cityId);
    }
  };

  const handleBackToSelection = () => {
    setSelectedCity(null);
    setShowTestRunner(false);
  };

  // If showing test runner, show the test interface
  if (showTestRunner) {
    return (
      <ErrorBoundary>
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setShowTestRunner(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to City Selection
          </Button>
          <IncidentTestRunner />
        </div>
      </ErrorBoundary>
    );
  }

  // If a city is selected, show the incident report for that city
  if (selectedCity) {
    const city = CITIES_WITH_RAIL.find(c => c.id === selectedCity);
    return (
      <ErrorBoundary>
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={handleBackToSelection}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to City Selection
          </Button>
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {city?.name} Rail Incident Reporting
            </h3>
            <p className="text-sm text-muted-foreground">{city?.agency}</p>
          </div>
          <ErrorBoundary>
            <IncidentReport selectedCity={city} />
          </ErrorBoundary>
          <div className="mt-6">
            <ErrorBoundary>
              <FailsafeIncidentReports city={city?.id} />
            </ErrorBoundary>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show city selection interface
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Rail Safety Incident Reporting
          </CardTitle>
          <CardDescription>
            Select a city to report safety incidents and concerns on their rail transit systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin && (
            <div className="mb-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowTestRunner(true)}
                className="text-sm"
              >
                🧪 Run Comprehensive Tests
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CITIES_WITH_RAIL.map((city) => (
              <Card
                key={city.id}
                className={`cursor-pointer transition-all duration-200 touch-target-large ${
                  city.available
                    ? "hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary/20 active:scale-100"
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

                  <div className="space-y-2 mt-3">
                    <p className="text-xs font-medium text-muted-foreground">Major Stations:</p>
                    <div className="flex flex-wrap gap-1">
                      {city.majorStations.slice(0, 3).map((station, index) => (
                        <span
                          key={index}
                          className="bg-muted/50 px-2 py-1 rounded text-xs"
                        >
                          {station}
                        </span>
                      ))}
                      {city.majorStations.length > 3 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{city.majorStations.length - 3} more
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
            About Multi-City Safety Reporting  
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>🚨 Currently Available:</strong> Chicago CTA, New York City MTA, Washington D.C. WMATA, 
              Denver RTD, Philadelphia SEPTA, Atlanta MARTA, Boston MBTA, and San Francisco BART/MUNI incident reporting with location tracking, photo upload, and real-time alerts.
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>🚧 Coming Soon:</strong> Safety reporting for LA Metro 
              with the same comprehensive features.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Safety Features for Each City:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Report incidents with location tracking</li>
              <li>• Upload photos and evidence</li>
              <li>• Anonymous reporting options</li>
              <li>• Real-time safety alerts</li>
              <li>• Direct integration with transit authorities</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};