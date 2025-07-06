import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, MapPinIcon, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOffline } from "@/hooks/useOffline";
import { CameraCapture } from "@/components/CameraCapture";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sanitizeInput, rateLimiter, validateLocation } from "@/lib/security";
import { DraggableIncidentCard } from "@/components/DraggableIncidentCard";

interface IncidentReportData {
  id: string;
  reporter_id: string;
  incident_type: string;
  location_name: string;
  description: string;
  created_at: string;
  transit_line: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  reporter_name: string;
}

interface City {
  id: string;
  name: string;
  agency: string;
  railLines: string[];
  majorStations: string[];
}

interface IncidentReportProps {
  selectedCity?: City;
}

const CTA_LINES = [
  { name: "Red Line", color: "bg-chicago-red" },
  { name: "Blue Line", color: "bg-chicago-blue" },
  { name: "Green Line", color: "bg-green-600" },
  { name: "Brown Line", color: "bg-amber-700" },
  { name: "Orange Line", color: "bg-orange-500" },
  { name: "Purple Line", color: "bg-purple-600" },
  { name: "Pink Line", color: "bg-pink-500" },
  { name: "Yellow Line", color: "bg-yellow-500" }
];

const INCIDENT_TYPES = [
  "Harassment",
  "Theft/Pickpocketing", 
  "Assault",
  "Public Indecency",
  "Suspicious Activity",
  "Medical Emergency",
  "Safety Concern",
  "Other"
];

const fetchIncidentReports = async (): Promise<IncidentReportData[]> => {
  const { data, error } = await supabase.rpc('get_incident_reports_with_reporter');
  
  if (error) {
    console.error('Error fetching incident reports:', error);
    throw error;
  }
  
  return data || [];
};

export const IncidentReport = ({ selectedCity }: IncidentReportProps) => {
  const [reportType, setReportType] = useState("");
  const [selectedCityId, setSelectedCityId] = useState(selectedCity?.id || "");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [line, setLine] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const { isOnline, saveOfflineReport } = useOffline();
  const queryClient = useQueryClient();

  // City data - this should match the MultiCityIncidentReport data
  const CITIES_WITH_RAIL = [
    {
      id: "chicago",
      name: "Chicago",
      agency: "CTA (Chicago Transit Authority)",
      railLines: ["Red Line", "Blue Line", "Brown Line", "Green Line", "Orange Line", "Pink Line", "Purple Line", "Yellow Line"],
      majorStations: ["Union Station", "Millennium Station", "LaSalle Street Station", "Ogilvie Transportation Center", "Roosevelt", "Clark/Lake", "Jackson", "Monroe"]
    },
    {
      id: "nyc",
      name: "New York City", 
      agency: "MTA (Metropolitan Transportation Authority)",
      railLines: ["4", "5", "6", "7", "A", "B", "C", "D", "E", "F", "G", "J", "L", "M", "N", "Q", "R", "W", "Z"],
      majorStations: ["Times Square-42nd St", "Grand Central-42nd St", "Union Square-14th St", "Penn Station-34th St", "Atlantic Terminal", "14th St-Union Sq", "42nd St-Port Authority"]
    },
    {
      id: "denver",
      name: "Denver",
      agency: "RTD (Regional Transportation District)",
      railLines: ["A Line", "B Line", "C Line", "D Line", "E Line", "F Line", "G Line", "H Line", "N Line", "R Line", "W Line"],
      majorStations: ["Union Station", "Downtown-Littleton", "Denver International Airport", "Westminster", "Lakewood", "Thornton"]
    },
    {
      id: "washington_dc", 
      name: "Washington D.C.",
      agency: "WMATA (Washington Metropolitan Area Transit Authority)",
      railLines: ["Red Line", "Blue Line", "Orange Line", "Silver Line", "Green Line", "Yellow Line"],
      majorStations: ["Union Station", "Gallery Pl-Chinatown", "Metro Center", "L'Enfant Plaza", "Dupont Circle", "Rosslyn"]
    },
    {
      id: "philadelphia",
      name: "Philadelphia",
      agency: "SEPTA (Southeastern Pennsylvania Transportation Authority)", 
      railLines: ["Market-Frankford Line", "Broad Street Line", "Regional Rail"],
      majorStations: ["30th Street Station", "Suburban Station", "Jefferson Station", "Temple University", "City Hall"]
    },
    {
      id: "atlanta",
      name: "Atlanta",
      agency: "MARTA (Metropolitan Atlanta Rapid Transit Authority)",
      railLines: ["Red Line", "Gold Line", "Blue Line", "Green Line"],
      majorStations: ["Five Points", "Peachtree Center", "Airport", "Lindbergh Center", "North Springs"]
    }
  ];

  const currentCity = CITIES_WITH_RAIL.find(city => city.id === selectedCityId) || selectedCity;
  
  const { 
    latitude, 
    longitude, 
    accuracy, 
    error: geoError, 
    loading: geoLoading,
    getCurrentLocation 
  } = useGeolocation();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Fetch incident reports with React Query
  const { data: incidents = [], isLoading, error } = useQuery({
    queryKey: ['incident-reports'],
    queryFn: fetchIncidentReports,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('incident-reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_reports'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleGetCurrentLocation = () => {
    setUseCurrentLocation(true);
    getCurrentLocation();
  };

  const handleSubmitReport = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit an incident report.",
        variant: "destructive"
      });
      return;
    }

    if (!reportType || (!selectedCity && !selectedCityId) || !location || !line || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to submit your report.",
        variant: "destructive"
      });
      return;
    }

    if (!currentCity) {
      toast({
        title: "City required",
        description: "Please select a city to report the incident.",
        variant: "destructive"
      });
      return;
    }

    // Validate custom location if "other" is selected
    if (location === "other" && !customLocation.trim()) {
      toast({
        title: "Location required",
        description: "Please specify the location when 'Other' is selected.",
        variant: "destructive"
      });
      return;
    }

    // Rate limiting check
    const rateLimitKey = `incident_report_${currentUser.id}`;
    if (!rateLimiter.canProceed(rateLimitKey, 3, 300000)) { // 3 reports per 5 minutes
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime(rateLimitKey) / 60000);
      toast({
        title: "Rate limit exceeded",
        description: `Please wait ${remainingTime} minutes before submitting another report.`,
        variant: "destructive"
      });
      return;
    }

    // Validate location if provided
    if (!validateLocation(latitude || undefined, longitude || undefined)) {
      toast({
        title: "Invalid location",
        description: "The location coordinates appear to be invalid.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Determine the final location name
    const finalLocationName = location === "other" ? customLocation : location;

    // Prepare report data with sanitized inputs
    const reportData = {
      reporter_id: currentUser.id,
      incident_type: sanitizeInput(reportType),
      transit_line: sanitizeInput(line),
      location_name: sanitizeInput(finalLocationName),
      description: sanitizeInput(description),
      latitude: latitude || null,
      longitude: longitude || null,
      accuracy: accuracy || null
    };

    // Handle offline scenario
    if (!isOnline) {
      const saved = await saveOfflineReport('incident', reportData);
      if (saved) {
        // Reset form
        setReportType("");
        setLocation("");
        setCustomLocation("");
        setLine("");
        setDescription("");
        setImageUrl(null);
        setUseCurrentLocation(false);

        toast({
          title: "📱 Report Saved Offline",
          description: "Your report will be submitted when connection returns.",
          variant: "default"
        });
      } else {
        toast({
          title: "Failed to save offline",
          description: "Please try again when online.",
          variant: "destructive"
        });
      }
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Starting incident report submission...', reportData);
      
      // Handle image upload if there is one
      let uploadedImageUrl = null;
      if (imageUrl) {
        console.log('Uploading image...');
        try {
          // Convert blob URL to actual file
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          
          const fileName = `incident-${Date.now()}.jpg`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('id-documents')
            .upload(`incident-photos/${fileName}`, blob, {
              contentType: 'image/jpeg',
            });

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            toast({
              title: "Image upload failed",
              description: uploadError.message || "Could not upload photo. Report will be submitted without image.",
              variant: "destructive"
            });
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('id-documents')
              .getPublicUrl(uploadData.path);
            uploadedImageUrl = publicUrl;
            console.log('Image uploaded successfully:', uploadedImageUrl);
          }
        } catch (imageError) {
          console.error('Image processing error:', imageError);
          toast({
            title: "Image processing failed",
            description: "Could not process photo. Report will be submitted without image.",
            variant: "destructive"
          });
        }
      }

      console.log('Inserting incident report into database...');
      // Insert incident report
      const { data: insertData, error } = await supabase
        .from('incident_reports')
        .insert({
          ...reportData,
          image_url: uploadedImageUrl
        })
        .select();

      console.log('Database insert result:', { data: insertData, error });

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      // Reset form
      setReportType("");
      setLocation("");
      setCustomLocation("");
      setLine("");
      setDescription("");
      setImageUrl(null);
      setUseCurrentLocation(false);

      toast({
        title: "✅ Report Submitted Successfully!",
        description: "Your incident report has been shared with other RAILSAVIOR users.",
      });

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Failed to submit report",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageCapture = (capturedImageUrl: string) => {
    setImageUrl(capturedImageUrl);
    toast({
      title: "Photo Added",
      description: "Photo has been attached to your incident report.",
    });
  };

  const handleRemoveImage = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete your report.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('incident_reports')
        .delete()
        .eq('id', reportId)
        .eq('reporter_id', currentUser.id);

      if (error) throw error;

      toast({
        title: "Report deleted",
        description: "Your incident report has been removed.",
      });

      queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Failed to delete report",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  // Get line color dynamically based on city and line
  const getLineColor = (lineName: string) => {
    // Use a more generic approach since we now support multiple cities
    return "bg-primary";
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    };
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Failed to load incident reports. Please try again later.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Form */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary-foreground/5 to-background">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary-foreground/10 border-b border-primary/20">
        <CardTitle className="flex items-center gap-2 text-primary">
          <div className="w-6 h-6 bg-primary rounded-full text-primary-foreground flex items-center justify-center text-sm font-bold">📝</div>
          Report an Incident
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Help keep the community informed about safety concerns - all reports are anonymous</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Incident Type */}
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select incident type" />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City Selection (if not pre-selected) */}
          {!selectedCity && (
            <Select value={selectedCityId} onValueChange={setSelectedCityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES_WITH_RAIL.map(city => (
                  <SelectItem key={city.id} value={city.id}>
                    <div className="flex items-center gap-2">
                      {city.name} - {city.agency}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Rail Line Selection (dynamic based on selected city) */}
          {currentCity && (
            <Select value={line} onValueChange={setLine}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${currentCity.name} line`} />
              </SelectTrigger>
              <SelectContent>
                {currentCity.railLines.map(railLine => (
                  <SelectItem key={railLine} value={railLine}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {railLine}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Location Selection */}
          <div className="space-y-2">
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder={currentCity ? `Select ${currentCity.name} station/location` : "Select station or location"} />
              </SelectTrigger>
              <SelectContent>
                {currentCity?.majorStations.map(station => (
                  <SelectItem key={station} value={station}>
                    {station}
                  </SelectItem>
                ))}
                <SelectItem value="other">Other location (specify below)</SelectItem>
              </SelectContent>
            </Select>
            
            {location === "other" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter specific location"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetCurrentLocation}
                  disabled={geoLoading}
                  className="px-3"
                >
                  <MapPinIcon className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {useCurrentLocation && (
              <div className="text-xs text-muted-foreground">
                {geoLoading && "📍 Getting your location..."}
                {geoError && <span className="text-destructive">❌ {geoError}</span>}
                {latitude && longitude && (
                  <span className="text-green-600">
                    ✅ Location captured ({accuracy ? `±${Math.round(accuracy)}m` : 'GPS'})
                  </span>
                )}
              </div>
            )}
          </div>

          <Textarea
            placeholder="Describe what happened..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            rows={3}
          />

          {/* Photo Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Photo Evidence (Optional)</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Add Photo
              </Button>
            </div>
            
            {imageUrl && (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="Incident photo" 
                  className="w-full h-32 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 w-6 h-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSubmitReport}
            disabled={isSubmitting || !currentUser}
            className="w-full"
          >
            {isSubmitting 
              ? "Submitting..." 
              : !currentUser 
                ? "Login to Submit Report" 
                : "Submit Report"
            }
          </Button>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Incidents ({incidents.length})</h3>
          {isLoading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
        </div>
        
        {incidents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {isLoading 
                ? "Loading recent incidents..." 
                : "No recent incidents reported. Stay safe!"
              }
            </CardContent>
          </Card>
        ) : (
          incidents.slice(0, 8).map(incident => (
            <DraggableIncidentCard
              key={incident.id}
              incident={incident}
              currentUser={currentUser}
              onDelete={handleDeleteReport}
              getLineColor={getLineColor}
              formatDateTime={formatDateTime}
            />
          ))
        )}
      </div>

      {/* Camera Modal */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleImageCapture}
        title="Document Incident"
      />
    </div>
  );
};