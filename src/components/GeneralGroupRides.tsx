import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, MapPin, Clock, Search, X, Trash2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GroupRideMessenger } from "./GroupRideMessenger";

interface GeneralRide {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  departure_location: string;
  destination_location: string;
  departure_time: string;
  max_spots: number;
  current_members: number;
  created_at: string;
  status: string;
  is_member?: boolean;
}

export const GeneralGroupRides = () => {
  const [rides, setRides] = useState<GeneralRide[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showMessenger, setShowMessenger] = useState(false);
  const [selectedRideForMessaging, setSelectedRideForMessaging] = useState<GeneralRide | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    departure_location: "",
    destination_location: "",
    departure_time: "",
    max_spots: 4
  });

  useEffect(() => {
    fetchRides();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchRides = async () => {
    setLoading(true);
    try {
      // First get all active rides
      const { data: ridesData, error: ridesError } = await supabase
        .from('general_group_rides')
        .select('*')
        .eq('status', 'active')
        .gte('departure_time', new Date().toISOString())
        .order('departure_time', { ascending: true });

      if (ridesError) throw ridesError;

      // Then get member counts and check membership for each ride
      const ridesWithCounts = await Promise.all(
        (ridesData || []).map(async (ride) => {
          const { count } = await supabase
            .from('general_ride_members')
            .select('*', { count: 'exact', head: true })
            .eq('ride_id', ride.id)
            .eq('status', 'joined');

          // Check if current user is a member
          let is_member = false;
          if (currentUser) {
            const { data: memberData } = await supabase
              .from('general_ride_members')
              .select('id')
              .eq('ride_id', ride.id)
              .eq('user_id', currentUser.id)
              .eq('status', 'joined')
              .maybeSingle();
            
            is_member = !!memberData;
          }

          return {
            ...ride,
            current_members: count || 0,
            is_member
          };
        })
      );

      setRides(ridesWithCounts);
    } catch (error) {
      console.error('Error fetching general rides:', error);
      toast({
        title: "Failed to load rides",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      const { error } = await supabase
        .from('general_group_rides')
        .insert({
          creator_id: user.id,
          title: formData.title,
          description: formData.description,
          departure_location: formData.departure_location,
          destination_location: formData.destination_location,
          departure_time: new Date(formData.departure_time).toISOString(),
          max_spots: formData.max_spots
        });

      if (error) throw error;

      toast({
        title: "Group ride created!",
        description: "Your ride request has been posted successfully.",
      });

      setFormData({
        title: "",
        description: "",
        departure_location: "",
        destination_location: "",
        departure_time: "",
        max_spots: 4
      });
      setShowCreateForm(false);
      fetchRides();
    } catch (error) {
      console.error('Error creating ride:', error);
      toast({
        title: "Failed to create ride",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinRide = async (rideId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to join a ride.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('general_ride_members')
        .insert({
          ride_id: rideId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Joined ride!",
        description: "You've successfully joined the group ride.",
      });

      fetchRides();
    } catch (error) {
      console.error('Error joining ride:', error);
      toast({
        title: "Failed to join ride",
        description: "You may have already joined this ride.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to delete your ride.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('general_group_rides')
        .delete()
        .eq('id', rideId)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast({
        title: "Ride deleted",
        description: "Your group ride has been removed.",
      });

      fetchRides();
    } catch (error) {
      console.error('Error deleting ride:', error);
      toast({
        title: "Failed to delete ride",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const filteredRides = rides.filter(ride => 
    !searchLocation || 
    ride.departure_location.toLowerCase().includes(searchLocation.toLowerCase()) ||
    ride.destination_location.toLowerCase().includes(searchLocation.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            General Group Rides
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create and join rides for any destination - no university required
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="bg-background"
              />
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Ride
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create General Group Ride
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRide} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Ride Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Concert at Red Rocks, Shopping Trip"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departure">Departure Location</Label>
                  <Input
                    id="departure"
                    value={formData.departure_location}
                    onChange={(e) => setFormData(prev => ({ ...prev, departure_location: e.target.value }))}
                    placeholder="Starting point"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={formData.destination_location}
                    onChange={(e) => setFormData(prev => ({ ...prev, destination_location: e.target.value }))}
                    placeholder="Where to"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departure_time">Departure Time</Label>
                  <Input
                    id="departure_time"
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
                      {[2, 3, 4, 5, 6, 7, 8].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num} spots</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add details about your ride, meeting point, etc..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Ride"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Rides List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">Loading rides...</div>
            </CardContent>
          </Card>
        ) : filteredRides.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                {searchLocation ? "No rides found for this location" : "No active rides available"}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredRides.map((ride) => (
            <Card key={ride.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{ride.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {ride.departure_location} → {ride.destination_location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ride.departure_time).toLocaleDateString()} at{' '}
                        {new Date(ride.departure_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Users className="w-3 h-3 mr-1" />
                    {ride.current_members}/{ride.max_spots}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {ride.description && (
                  <p className="text-sm text-muted-foreground mb-4">{ride.description}</p>
                )}
                
                {/* Member Controls - Show messaging if user is part of ride */}
                {(currentUser && (ride.is_member || ride.creator_id === currentUser.id)) && (
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="w-full mb-3"
                    onClick={() => {
                      setSelectedRideForMessaging(ride);
                      setShowMessenger(true);
                    }}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Group Chat
                  </Button>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    Posted {new Date(ride.created_at).toLocaleDateString()}
                  </div>
                  {currentUser && ride.creator_id === currentUser.id ? (
                    <Button 
                      onClick={() => handleDeleteRide(ride.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => joinRide(ride.id)}
                      disabled={ride.current_members >= ride.max_spots || ride.is_member}
                      size="sm"
                    >
                      {ride.is_member 
                        ? "Already Joined" 
                        : ride.current_members >= ride.max_spots 
                          ? "Full" 
                          : "Join Ride"
                      }
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Messaging Modal */}
      {showMessenger && selectedRideForMessaging && (
        <GroupRideMessenger
          rideId={selectedRideForMessaging.id}
          rideTitle={selectedRideForMessaging.title}
          onClose={() => {
            setShowMessenger(false);
            setSelectedRideForMessaging(null);
          }}
        />
      )}
    </div>
  );
};