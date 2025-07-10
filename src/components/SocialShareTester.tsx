import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTransitSystemFromCity, getTransitDisplayName } from "@/utils/transitSystemDetection";
import { SocialShare } from "@/components/SocialShare";
import { TestTube, MapPin, User } from "lucide-react";

export const SocialShareTester = () => {
  const [testCity, setTestCity] = useState<string>("");
  const [testName, setTestName] = useState<string>("Jonathan Hand");
  const [selectedCity, setSelectedCity] = useState<string>("");

  const testCities = [
    { value: "chicago", label: "Chicago" },
    { value: "nyc", label: "New York City" },
    { value: "washington_dc", label: "Washington DC" },
    { value: "atlanta", label: "Atlanta" },
    { value: "philadelphia", label: "Philadelphia" },
    { value: "denver", label: "Denver" },
    { value: "los_angeles", label: "Los Angeles" },
    { value: "san_francisco", label: "San Francisco" },
    { value: "boston", label: "Boston" },
    { value: "seattle", label: "Seattle" },
    { value: "portland", label: "Portland" },
    { value: "miami", label: "Miami" },
  ];

  const currentCity = testCity || selectedCity;
  const transitSystem = getTransitSystemFromCity(currentCity);
  const displayName = getTransitDisplayName(transitSystem);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Social Share Transit Detection Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="test-name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Test Name
            </Label>
            <Input
              id="test-name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Enter a name to test"
            />
          </div>

          {/* City Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Select City
            </Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a city to test" />
              </SelectTrigger>
              <SelectContent>
                {testCities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manual City Input */}
          <div className="space-y-2">
            <Label htmlFor="manual-city">Or Type Custom City</Label>
            <Input
              id="manual-city"
              value={testCity}
              onChange={(e) => setTestCity(e.target.value)}
              placeholder="Type any city name"
            />
          </div>

          {/* Detection Results */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold">Detection Results:</h4>
            <p><strong>Input City:</strong> {currentCity || "None"}</p>
            <p><strong>Detected Transit:</strong> {transitSystem}</p>
            <p><strong>Full Name:</strong> {displayName}</p>
            <p><strong>Share Message Preview:</strong></p>
            <div className="bg-background border rounded p-3 mt-2">
              <em>"{testName} is traveling safe on the {transitSystem} with RailSavior! 🚇✨"</em>
            </div>
          </div>

          {/* Clear Button */}
          <Button 
            onClick={() => {
              setTestCity("");
              setSelectedCity("");
              setTestName("Jonathan Hand");
            }}
            variant="outline"
            className="w-full"
          >
            Reset Test
          </Button>
        </CardContent>
      </Card>

      {/* Live Social Share Preview */}
      {currentCity && (
        <SocialShare
          userName={testName}
          transitLine={transitSystem}
          className="animate-fade-in"
        />
      )}
    </div>
  );
};