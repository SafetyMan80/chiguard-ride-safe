import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Incident {
  id: string;
  type: string;
  location: string;
  description: string;
  timestamp: Date;
  line: string;
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
  "Suspicious Activity",
  "Medical Emergency",
  "Safety Concern",
  "Other"
];

export const IncidentReport = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [reportType, setReportType] = useState("");
  const [location, setLocation] = useState("");
  const [line, setLine] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

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
      line
    };

    setIncidents(prev => [newIncident, ...prev]);
    
    // Reset form
    setReportType("");
    setLocation("");
    setLine("");
    setDescription("");

    toast({
      title: "Report Submitted",
      description: "Your incident report has been shared with other CHIGUARD users.",
    });
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

          <input
            type="text"
            placeholder="Station or location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-chicago-blue"
          />

          <Textarea
            placeholder="Describe what happened..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            rows={3}
          />

          <Button 
            variant="chicago" 
            onClick={handleSubmitReport}
            className="w-full"
          >
            Submit Report
          </Button>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Recent Incidents</h3>
        {incidents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No recent incidents reported. Stay safe!
            </CardContent>
          </Card>
        ) : (
          incidents.slice(0, 5).map(incident => (
            <Card key={incident.id} className="animate-fade-in">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{incident.type}</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${getLineColor(incident.line)}`} />
                        {incident.line}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3" />
                      {incident.location}
                    </div>
                    <p className="text-sm">{incident.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {incident.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};