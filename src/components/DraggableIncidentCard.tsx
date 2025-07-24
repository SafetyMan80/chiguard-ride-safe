import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocationDisplay } from "@/components/LocationDisplay";

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

interface DraggableIncidentCardProps {
  incident: IncidentReportData;
  currentUser: any;
  onDelete: (reportId: string) => void;
  getLineColor: (lineName: string) => string;
  formatDateTime: (dateTime: string) => { time: string; date: string };
}

export const DraggableIncidentCard = ({ 
  incident, 
  currentUser, 
  onDelete, 
  getLineColor, 
  formatDateTime 
}: DraggableIncidentCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const [startX, setStartX] = useState(0);
  const { toast } = useToast();
  
  const { time, date } = formatDateTime(incident.created_at);
  const canDelete = currentUser && incident.reporter_id === currentUser.id;
  
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!canDelete) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setIsDragging(true);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !canDelete) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const distance = clientX - startX;
    
    // Only allow drag to the right (positive direction)
    if (distance > 0) {
      setDragDistance(Math.min(distance, 150));
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || !canDelete) return;
    
    // If dragged more than 100px, delete the incident
    if (dragDistance > 100) {
      onDelete(incident.id);
      toast({
        title: "Incident resolved",
        description: "Report moved to trash and marked as resolved.",
      });
    }
    
    setIsDragging(false);
    setDragDistance(0);
    setStartX(0);
  };

  const handleQuickDelete = () => {
    if (canDelete) {
      onDelete(incident.id);
    }
  };

  return (
    <div 
      className="relative overflow-hidden"
      style={{
        transform: `translateX(${dragDistance}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Trash Background */}
      {canDelete && dragDistance > 20 && (
        <div 
          className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-lg"
          style={{ opacity: Math.min(dragDistance / 100, 1) }}
        >
          <div className="flex items-center gap-2 text-white">
            <Trash2 className="w-5 h-5" />
            <span className="font-medium">
              {dragDistance > 100 ? "Release to delete" : "Drag to resolve"}
            </span>
          </div>
        </div>
      )}
      
      <Card 
        className={`animate-fade-in ${canDelete ? 'cursor-grab active:cursor-grabbing' : ''} ${
          dragDistance > 100 ? 'bg-red-50 border-red-200' : ''
        }`}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-semibold">
                  {incident.incident_type}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${getLineColor(incident.transit_line)}`} />
                  {incident.transit_line}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <MapPin className="w-3 h-3" />
                {incident.location_name}
              </div>
              <p className="text-sm">{incident.description}</p>
              <p className="text-xs text-muted-foreground">
                Reported anonymously
              </p>
              
              {incident.image_url && (
                <div className="mt-2">
                  <img 
                    src={incident.image_url} 
                    alt="Incident evidence" 
                    className="w-20 h-20 object-cover rounded border"
                  />
                </div>
              )}
              
              {incident.latitude && incident.longitude && (
                <div className="mt-1">
                  <LocationDisplay 
                    latitude={incident.latitude}
                    longitude={incident.longitude}
                    accuracy={incident.accuracy}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-right">
                <span className="text-xs text-muted-foreground">{time}</span>
                <div className="text-xs text-muted-foreground">{date}</div>
              </div>
              {canDelete && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleQuickDelete}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 h-8 w-8"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    👆 or drag →
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};