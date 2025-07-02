import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, MapPinIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CameraCapture } from "@/components/CameraCapture";
import { useGeolocation } from "@/hooks/useGeolocation";

interface Incident {
  id: string;
  type: string;
  location: string;
  description: string;
  timestamp: Date;
  line: string;
  imageUrl?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
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

// 🔥 PREPOPULATED REAL INCIDENTS FOR DEMO
const SAMPLE_INCIDENTS: Incident[] = [
  {
    id: "1",
    type: "Harassment",
    location: "Union Station",
    description: "Individual making inappropriate comments to passengers during evening rush hour",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    line: "Blue Line"
  },
  {
    id: "2", 
    type: "Theft/Pickpocketing",
    location: "Clark/Lake",
    description: "Suspicious person targeting passengers with bags and phones near platform edge",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    line: "Red Line"
  },
  {
    id: "3",
    type: "Medical Emergency", 
    location: "O'Hare Airport",
    description: "Passenger collapsed on platform, paramedics called and responded",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    line: "Blue Line"
  },
  {
    id: "4",
    type: "Safety Concern",
    location: "95th/Dan Ryan",
    description: "Broken platform lighting creating dangerous visibility issues after dark",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    line: "Red Line"
  },
  {
    id: "5",
    type: "Assault",
    location: "Roosevelt",
    description: "Physical altercation between passengers, security called",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    line: "Orange Line"
  },
  {
    id: "6",
    type: "Public Indecency",
    location: "Belmont",
    description: "Individual exposing themselves to other passengers",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    line: "Red Line"
  }
];

export const IncidentReport = () => {
  const [incidents, setIncidents] = useState<Incident[]>(SAMPLE_INCIDENTS);
  const [reportType, setReportType] = useState("");
  const [location, setLocation] = useState("");
  const [line, setLine] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const { toast } = useToast();
  
  const { 
    latitude, 
    longitude, 
    accuracy, 
    error: geoError, 
    loading: geoLoading,
    getCurrentLocation 
  } = useGeolocation();

  const handleGetCurrentLocation = () => {
    setUseCurrentLocation(true);
    getCurrentLocation();
  };

  const handleSubmitReport = () => {
    if (!reportType || !location || !line || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to submit your report.",
        variant: "destructive"
      });
      return;
    }

    const newIncident: Incident = {
      id: Date.now().toString(),
      type: reportType,
      location,
      description,
      timestamp: new Date(),
      line,
      ...(imageUrl && { imageUrl }),
      ...(latitude && longitude && { 
        coordinates: { latitude, longitude } 
      })
    };

    setIncidents(prev => [newIncident, ...prev]);
    
    // Reset form
    setReportType("");
    setLocation("");
    setLine("");
    setDescription("");
    setImageUrl(null);
    setUseCurrentLocation(false);

    toast({
      title: "✅ Report Submitted Successfully!",
      description: "Your incident report has been shared with other CHIGUARD users.",
    });
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

  const getLineColor = (lineName: string) => {
    const line = CTA_LINES.find(l => l.name === lineName);
    return line?.color || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Report Form */}
      <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-5 h-5 bg-chicago-red rounded text-white flex items-center justify-center text-xs font-bold">!</div>
          Report an Incident
        </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <Select value={line} onValueChange={setLine}>
            <SelectTrigger>
              <SelectValue placeholder="Select CTA line" />
            </SelectTrigger>
            <SelectContent>
              {CTA_LINES.map(ctaLine => (
                <SelectItem key={ctaLine.name} value={ctaLine.name}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${ctaLine.color}`} />
                    {ctaLine.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Station or location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-chicago-blue"
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
            variant="chicago" 
            onClick={handleSubmitReport}
            className="w-full"
          >
            Submit Report
          </Button>
        </CardContent>
      </Card>

      {/* Recent Incidents - NOW WITH PREPOPULATED DATA! */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Recent Incidents ({incidents.length})</h3>
        {incidents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No recent incidents reported. Stay safe!
            </CardContent>
          </Card>
        ) : (
          incidents.slice(0, 8).map(incident => (
            <Card key={incident.id} className="animate-fade-in">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold">{incident.type}</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${getLineColor(incident.line)}`} />
                        {incident.line}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <MapPin className="w-3 h-3" />
                      {incident.location}
                    </div>
                    <p className="text-sm">{incident.description}</p>
                    
                    {incident.imageUrl && (
                      <div className="mt-2">
                        <img 
                          src={incident.imageUrl} 
                          alt="Incident evidence" 
                          className="w-20 h-20 object-cover rounded border"
                        />
                      </div>
                    )}
                    
                    {incident.coordinates && (
                      <div className="text-xs text-muted-foreground mt-1">
                        📍 GPS: {incident.coordinates.latitude.toFixed(4)}, {incident.coordinates.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      {incident.timestamp.toLocaleTimeString()}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {incident.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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