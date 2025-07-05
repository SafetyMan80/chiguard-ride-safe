import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, MapPin, Clock, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreateRideForm } from "./CreateRideForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface GroupRide {
  id: string;
  creator_id: string;
  university_name: string;
  cta_line: string;
  station_name: string;
  departure_time: string;
  max_spots: number;
  description: string | null;
  status: string;
  created_at: string;
  member_count: number;
  is_member: boolean;
  creator_name: string;
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

const fetchGroupRides = async (selectedUniversity: string, userId: string | null): Promise<GroupRide[]> => {
  let query = supabase
    .from('group_rides')
    .select('*')
    .eq('status', 'active')
    .gte('departure_time', new Date().toISOString())
    .order('departure_time', { ascending: true });

  if (selectedUniversity) {
    query = query.eq('university_name', selectedUniversity);
  }

  const { data: rides, error } = await query;
  if (error) throw error;

  if (!rides || rides.length === 0) return [];

  // Get creator profiles
  const creatorIds = [...new Set(rides.map(ride => ride.creator_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, full_name')
    .in('user_id', creatorIds);

  // Get member counts and check if current user is a member
  const rideIds = rides.map(ride => ride.id);
  
  const { data: memberData, error: memberError } = await supabase
    .from('group_ride_members')
    .select('ride_id, user_id')
    .in('ride_id', rideIds)
    .eq('status', 'joined');

  if (memberError) throw memberError;

  // Process the data to include member counts and membership status
  return rides.map(ride => {
    const creatorProfile = profiles?.find(p => p.user_id === ride.creator_id);
    return {
      ...ride,
      member_count: memberData?.filter(m => m.ride_id === ride.id).length || 0,
      is_member: userId ? memberData?.some(m => m.ride_id === ride.id && m.user_id === userId) || false : false,
      creator_name: creatorProfile?.full_name || 'Anonymous'
    };
  });
};

export const UniversityRides = () => {
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user and profile
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setUserProfile(profile);
      }
    };

    getCurrentUser();
  }, []);

  // Fetch rides with React Query
  const { data: rides = [], isLoading, error } = useQuery({
    queryKey: ['group-rides', selectedUniversity, currentUser?.id],
    queryFn: () => fetchGroupRides(selectedUniversity, currentUser?.id),
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('group-rides-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_rides'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['group-rides'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_ride_members'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['group-rides'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleJoinRide = async (rideId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to join a group ride.",
        variant: "destructive"
      });
      return;
    }

    console.log('Attempting to join ride:', {
      rideId,
      userId: currentUser.id,
      userEmail: currentUser.email
    });

    try {
      const { data, error } = await supabase
        .from('group_ride_members')
        .insert({
          ride_id: rideId,
          user_id: currentUser.id
        })
        .select();

      console.log('Join ride result:', { data, error });

      if (error) {
        console.error('Join ride error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already joined",
            description: "You're already part of this group ride.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Failed to join ride",
            description: `${error.message} (Code: ${error.code})`,
            variant: "destructive"
          });
        }
        return;
      }

      console.log('Successfully joined ride:', data);
      toast({
        title: "Joined group ride!",
        description: "You've successfully joined this group ride.",
      });

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['group-rides'] });
    } catch (error) {
      console.error('Unexpected error joining ride:', error);
      toast({
        title: "Failed to join ride",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getLineColor = (line: string) => {
    const colors: { [key: string]: string } = {
      'Red Line': 'bg-red-600',
      'Blue Line': 'bg-blue-600',
      'Brown Line': 'bg-amber-600',
      'Green Line': 'bg-green-600',
      'Orange Line': 'bg-orange-600',
      'Pink Line': 'bg-pink-600',
      'Purple Line': 'bg-purple-600',
      'Yellow Line': 'bg-yellow-600'
    };
    return colors[line] || 'bg-gray-600';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Failed to load group rides. Please try again later.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showCreateForm && (
        <CreateRideForm
          onRideCreated={() => {
            setShowCreateForm(false);
            queryClient.invalidateQueries({ queryKey: ['group-rides'] });
          }}
          onCancel={() => setShowCreateForm(false)}
          userUniversity={userProfile?.university_name}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-chicago-blue" />
            Group Rides by University
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            <Button
              variant={selectedUniversity === "" ? "chicago" : "chicago-outline"}
              size="default"
              onClick={() => setSelectedUniversity("")}
              className="w-full h-10"
            >
              All Universities
            </Button>
            
            <div className="grid grid-cols-1 gap-2">
              {CHICAGO_UNIVERSITIES.slice(0, 6).map(uni => (
                <Button
                  key={uni}
                  variant={selectedUniversity === uni ? "chicago" : "chicago-outline"}
                  size="default"
                  onClick={() => setSelectedUniversity(uni)}
                  className="h-12 text-sm font-medium text-left justify-start px-4"
                >
                  {uni}
                </Button>
              ))}
            </div>
          </div>
          
          <Button 
            variant="chicago" 
            className="w-full"
            onClick={() => setShowCreateForm(true)}
            disabled={!currentUser}
          >
            {currentUser ? "Create Group Ride" : "Login to Create Ride"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Available Group Rides</h3>
          {isLoading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
        </div>
        
        {rides.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {isLoading 
                ? "Loading group rides..." 
                : `No group rides available${selectedUniversity ? ` for ${selectedUniversity}` : ""}.`
              }
            </CardContent>
          </Card>
        ) : (
          rides.map(ride => {
            const availableSpots = ride.max_spots - ride.member_count;
            const isFull = availableSpots <= 0;
            
            return (
              <Card key={ride.id} className="animate-fade-in">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-chicago-light-blue text-chicago-dark-blue">
                          {ride.creator_name[0]?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{ride.creator_name}</p>
                        <p className="text-sm text-muted-foreground">{ride.university_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ride.is_member && (
                        <Badge variant="default" className="bg-green-600">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Joined
                        </Badge>
                      )}
                      <Badge variant={isFull ? "destructive" : "secondary"}>
                        {availableSpots} {availableSpots === 1 ? 'spot' : 'spots'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${getLineColor(ride.cta_line)}`} />
                      <span>{ride.cta_line} - {ride.station_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-3 h-3" />
                      <span>Departing {formatDateTime(ride.departure_time)}</span>
                    </div>
                    {ride.member_count > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-3 h-3" />
                        <span>{ride.member_count + 1} rider{ride.member_count > 0 ? 's' : ''} total</span>
                      </div>
                    )}
                  </div>
                  
                  {ride.description && (
                    <p className="text-sm text-muted-foreground mb-3">{ride.description}</p>
                  )}
                  
                  <Button 
                    variant={ride.is_member ? "outline" : "chicago-outline"}
                    size="sm" 
                    className="w-full"
                    onClick={() => handleJoinRide(ride.id)}
                    disabled={!currentUser || ride.is_member || isFull}
                  >
                    {!currentUser 
                      ? "Login to Join" 
                      : ride.is_member 
                        ? "Already Joined" 
                        : isFull 
                          ? "Ride Full" 
                          : "Join Group Ride"
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};