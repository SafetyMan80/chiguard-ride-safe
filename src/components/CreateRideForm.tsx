import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface CreateRideFormProps {
  onRideCreated: () => void;
  onCancel: () => void;
  userUniversity?: string;
  selectedUniversity?: string;
  cityData?: {
    id: string;
    name: string;
    agency: string;
    universities: Array<{
      id: string;
      name: string;
      shortName: string;
    }>;
  };
  transitLines?: Array<{
    name: string;
    color: string;
  }>;
}

// Station data for each city and line
const STATION_DATA_BY_CITY: { [key: string]: { [line: string]: string[] } } = {
  chicago: {
    "Red Line": ["Howard", "Jarvis", "Morse", "Loyola", "Granville", "Thorndale", "Bryn Mawr", "Berwyn", "Argyle", "Lawrence", "Wilson", "Sheridan", "Addison", "Belmont", "Fullerton", "North/Clybourn", "Clark/Division", "Chicago/State", "Grand/State", "Lake/State", "Monroe/State", "Jackson/State", "Harrison", "Roosevelt", "Cermak-Chinatown", "Sox-35th", "47th", "Garfield", "63rd", "69th", "79th", "87th", "95th/Dan Ryan"],
    "Blue Line": ["O'Hare", "Rosemont", "Cumberland", "Harlem (O'Hare)", "Jefferson Park", "Montrose", "Irving Park", "Addison", "Belmont", "Logan Square", "California", "Western", "Damen", "Division", "Chicago", "Grand", "Clark/Lake", "Washington", "Monroe", "Jackson", "LaSalle", "Clinton", "UIC-Halsted", "Racine", "Illinois Medical District", "Western (Forest Park)", "Kedzie-Homan", "Pulaski", "Cicero", "Austin", "Oak Park", "Harlem (Forest Park)", "Forest Park"],
    "Brown Line": ["Kimball", "Kedzie", "Francisco", "Rockwell", "Western", "Damen", "Montrose", "Irving Park", "Addison", "Paulina", "Southport", "Belmont", "Wellington", "Diversey", "Fullerton", "Armitage", "Sedgwick", "Chicago", "Merchandise Mart", "Clark/Lake", "State/Lake", "Washington/Wells", "Quincy/Wells", "LaSalle/Van Buren", "Harold Washington Library"],
    "Green Line": ["Harlem/Lake", "Oak Park", "Ridgeland", "Austin", "Central", "Laramie", "Cicero", "Pulaski", "Conservatory", "Kedzie", "California", "Ashland/63rd", "Halsted", "Indiana", "35th-Bronzeville-IIT", "Roosevelt", "Cermak-McCormick Place", "Clark/Lake"],
    "Orange Line": ["Midway", "Pulaski", "Kedzie", "Western", "35th/Archer", "Ashland", "Halsted", "Roosevelt", "Harold Washington Library", "LaSalle/Van Buren", "Quincy/Wells", "Washington/Wells", "Clark/Lake"],
    "Pink Line": ["54th/Cermak", "Cicero", "Kostner", "Pulaski", "Central Park", "Kedzie", "California", "Western", "Damen", "18th", "Polk", "Ashland", "Morgan", "Clinton", "Clark/Lake"],
    "Purple Line": ["Linden", "Central", "Noyes", "Foster", "Davis", "Dempster", "Main", "South Blvd", "Howard", "Wilson", "Belmont", "Fullerton", "Armitage", "Sedgwick", "Chicago", "Merchandise Mart", "Clark/Lake"],
    "Yellow Line": ["Howard", "Oakton-Skokie", "Dempster-Skokie"]
  }
};

// Default transit lines for cities
const TRANSIT_LINES_BY_CITY: { [key: string]: Array<{ name: string; color: string }> } = {
  chicago: [
    { name: "Red Line", color: "bg-red-600" },
    { name: "Blue Line", color: "bg-blue-600" },
    { name: "Brown Line", color: "bg-amber-600" },
    { name: "Green Line", color: "bg-green-600" },
    { name: "Orange Line", color: "bg-orange-600" },
    { name: "Pink Line", color: "bg-pink-600" },
    { name: "Purple Line", color: "bg-purple-600" },
    { name: "Yellow Line", color: "bg-yellow-600" }
  ],
  denver: [
    { name: "A Line", color: "bg-green-600" },
    { name: "B Line", color: "bg-blue-600" },
    { name: "C Line", color: "bg-orange-600" },
    { name: "D Line", color: "bg-yellow-600" },
    { name: "E Line", color: "bg-purple-600" },
    { name: "F Line", color: "bg-red-600" },
    { name: "G Line", color: "bg-teal-600" },
    { name: "H Line", color: "bg-pink-600" },
    { name: "N Line", color: "bg-cyan-600" },
    { name: "R Line", color: "bg-indigo-600" },
    { name: "W Line", color: "bg-amber-600" }
  ],
  nyc: [
    { name: "4 Train", color: "bg-green-600" },
    { name: "5 Train", color: "bg-green-600" },
    { name: "6 Train", color: "bg-green-600" },
    { name: "7 Train", color: "bg-purple-600" },
    { name: "A Train", color: "bg-blue-600" },
    { name: "B Train", color: "bg-orange-600" },
    { name: "C Train", color: "bg-blue-600" },
    { name: "D Train", color: "bg-orange-600" },
    { name: "E Train", color: "bg-blue-600" },
    { name: "F Train", color: "bg-orange-600" },
    { name: "G Train", color: "bg-green-600" },
    { name: "J Train", color: "bg-amber-600" },
    { name: "L Train", color: "bg-gray-600" },
    { name: "M Train", color: "bg-orange-600" },
    { name: "N Train", color: "bg-yellow-600" },
    { name: "Q Train", color: "bg-yellow-600" },
    { name: "R Train", color: "bg-yellow-600" },
    { name: "W Train", color: "bg-yellow-600" }
  ],
  washington_dc: [
    { name: "Red Line", color: "bg-red-600" },
    { name: "Blue Line", color: "bg-blue-600" },
    { name: "Orange Line", color: "bg-orange-600" },
    { name: "Silver Line", color: "bg-gray-400" },
    { name: "Green Line", color: "bg-green-600" },
    { name: "Yellow Line", color: "bg-yellow-600" }
  ],
  los_angeles: [
    { name: "Red Line", color: "bg-red-600" },
    { name: "Purple Line", color: "bg-purple-600" },
    { name: "Blue Line", color: "bg-blue-600" },
    { name: "Green Line", color: "bg-green-600" },
    { name: "Gold Line", color: "bg-yellow-600" },
    { name: "Expo Line", color: "bg-cyan-600" }
  ],
  philadelphia: [
    { name: "Market-Frankford Line", color: "bg-blue-600" },
    { name: "Broad Street Line", color: "bg-orange-600" },
    { name: "Regional Rail", color: "bg-purple-600" }
  ],
  atlanta: [
    { name: "Red Line", color: "bg-red-600" },
    { name: "Gold Line", color: "bg-yellow-600" },
    { name: "Blue Line", color: "bg-blue-600" },
    { name: "Green Line", color: "bg-green-600" }
  ],
  san_francisco: [
    { name: "BART Red Line", color: "bg-red-600" },
    { name: "BART Blue Line", color: "bg-blue-600" },
    { name: "BART Green Line", color: "bg-green-600" },
    { name: "BART Yellow Line", color: "bg-yellow-600" },
    { name: "MUNI N-Judah", color: "bg-blue-500" },
    { name: "MUNI T-Third", color: "bg-red-500" },
    { name: "MUNI K-Ingleside", color: "bg-orange-500" },
    { name: "MUNI L-Taraval", color: "bg-purple-500" },
    { name: "MUNI M-Ocean View", color: "bg-green-500" },
    { name: "MUNI J-Church", color: "bg-amber-500" }
  ]
};

export const CreateRideForm = ({ 
  onRideCreated, 
  onCancel, 
  userUniversity, 
  selectedUniversity, 
  cityData,
  transitLines 
}: CreateRideFormProps) => {
  const [formData, setFormData] = useState({
    university_name: selectedUniversity || userUniversity || "",
    transit_line: "",
    station_name: "",
    departure_time: "",
    max_spots: 4,
    description: "",
    is_recurring: false,
    recurrence_pattern: "weekly"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Get universities and transit lines for the current city
  const universities = cityData?.universities || [];
  const availableTransitLines = transitLines || TRANSIT_LINES_BY_CITY[cityData?.id || 'chicago'] || [];
  const agencyName = cityData?.agency || 'Transit';

  // Get available stations for the selected line
  const availableStations = formData.transit_line 
    ? STATION_DATA_BY_CITY[cityData?.id || 'chicago']?.[formData.transit_line] || []
    : [];

  // Reset station when line changes
  const handleLineChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      transit_line: value,
      station_name: "" // Reset station when line changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create a group ride.",
          variant: "destructive"
        });
        return;
      }

      // Convert departure time to ISO format
      const departureDateTime = new Date(formData.departure_time).toISOString();

      const rideData: any = {
        creator_id: user.id,
        university_name: formData.university_name,
        cta_line: formData.transit_line, // Still use cta_line field name for database compatibility
        station_name: formData.station_name,
        departure_time: departureDateTime,
        max_spots: formData.max_spots,
        description: formData.description,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null
      };

      // Calculate next occurrence if recurring
      if (formData.is_recurring) {
        const departureDate = new Date(formData.departure_time);
        let nextOccurrence: Date;
        
        switch (formData.recurrence_pattern) {
          case 'daily':
            nextOccurrence = new Date(departureDate.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            nextOccurrence = new Date(departureDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            nextOccurrence = new Date(departureDate);
            nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
            break;
          default:
            nextOccurrence = new Date(departureDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        
        rideData.next_occurrence = nextOccurrence.toISOString();
      }

      const { error } = await supabase
        .from('group_rides')
        .insert(rideData);

      if (error) throw error;

      toast({
        title: "Group ride created!",
        description: "Your ride request has been posted successfully.",
      });

      onRideCreated();
    } catch (error) {
      console.error('Error creating ride:', error);
      toast({
        title: "Failed to create ride",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-chicago-blue" />
            Create Group Ride
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Select 
              value={formData.university_name} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, university_name: value }))}
              required
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select your university" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-[100]">
                {universities.map(uni => (
                  <SelectItem key={uni.id} value={uni.name}>{uni.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transit_line">{agencyName} Line</Label>
              <Select 
                value={formData.transit_line} 
                onValueChange={handleLineChange}
                required
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select line" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-[100]">
                  {availableTransitLines.map(line => (
                    <SelectItem key={line.name} value={line.name}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${line.color}`} />
                        {line.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="station">Station</Label>
              {formData.transit_line && availableStations.length > 0 ? (
                <Select 
                  value={formData.station_name} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, station_name: value }))}
                  required
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-[100] max-h-60 overflow-y-auto">
                    {availableStations.map(station => (
                      <SelectItem key={station} value={station}>
                        {station}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="station"
                  value={formData.station_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, station_name: e.target.value }))}
                  placeholder={formData.transit_line ? "Station name" : "Select a line first"}
                  disabled={!formData.transit_line}
                  required
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure Time</Label>
              <Input
                id="departure"
                type="datetime-local"
                value={formData.departure_time}
                onChange={(e) => setFormData(prev => ({ ...prev, departure_time: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spots">Max Spots</Label>
              <Select 
                value={formData.max_spots.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, max_spots: parseInt(value) }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-[100]">
                  {[2, 3, 4, 5, 6].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num} spots</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add details about your ride..."
              rows={3}
            />
          </div>

          {/* Recurring Options */}
          <div className="space-y-3 p-4 border border-border rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_recurring: !!checked }))
                }
              />
              <Label htmlFor="recurring" className="text-sm font-medium">
                Make this ride recurring
              </Label>
            </div>
            
            {formData.is_recurring && (
              <div className="space-y-2">
                <Label htmlFor="pattern">Recurrence Pattern</Label>
                <Select 
                  value={formData.recurrence_pattern} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence_pattern: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-[100]">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  A new ride will be automatically created for the next {formData.recurrence_pattern} occurrence.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Creating..." : "Create Ride"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};