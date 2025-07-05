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
}

const CHICAGO_UNIVERSITIES = [
  "University of Chicago",
  "Northwestern University", 
  "DePaul University",
  "Loyola University Chicago",
  "Illinois Institute of Technology",
  "University of Illinois Chicago",
  "Chicago State University",
  "Northeastern Illinois University",
  "Columbia College Chicago",
  "Roosevelt University"
];

const CTA_LINES = [
  { name: "Red Line", color: "bg-red-600" },
  { name: "Blue Line", color: "bg-blue-600" },
  { name: "Brown Line", color: "bg-amber-600" },
  { name: "Green Line", color: "bg-green-600" },
  { name: "Orange Line", color: "bg-orange-600" },
  { name: "Pink Line", color: "bg-pink-600" },
  { name: "Purple Line", color: "bg-purple-600" },
  { name: "Yellow Line", color: "bg-yellow-600" }
];

export const CreateRideForm = ({ onRideCreated, onCancel, userUniversity, selectedUniversity }: CreateRideFormProps) => {
  const [formData, setFormData] = useState({
    university_name: selectedUniversity || userUniversity || "",
    cta_line: "",
    station_name: "",
    departure_time: "",
    max_spots: 4,
    description: "",
    is_recurring: false,
    recurrence_pattern: "weekly"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
        cta_line: formData.cta_line,
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
              <SelectTrigger>
                <SelectValue placeholder="Select your university" />
              </SelectTrigger>
              <SelectContent>
                {CHICAGO_UNIVERSITIES.map(uni => (
                  <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cta_line">CTA Line</Label>
              <Select 
                value={formData.cta_line} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, cta_line: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select line" />
                </SelectTrigger>
                <SelectContent>
                  {CTA_LINES.map(line => (
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
              <Input
                id="station"
                value={formData.station_name}
                onChange={(e) => setFormData(prev => ({ ...prev, station_name: e.target.value }))}
                placeholder="Station name"
                required
              />
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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