import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, MapPin, Clock, UserCheck, Trash2, Repeat, Plus, Phone, MessageSquare, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreateRideForm } from "./CreateRideForm";
import { ProfileView } from "./ProfileView";
import { GroupRideMessenger } from "./GroupRideMessenger";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCampusSecurity } from "@/data/campusSecurity";

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
  is_recurring: boolean;
  recurrence_pattern: string | null;
  next_occurrence: string | null;
}

interface UniversityRidesProps {
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
  selectedUniversityId?: string;
}

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

export const UniversityRides = ({ cityData, selectedUniversityId }: UniversityRidesProps) => {
  // Auto-select university if selectedUniversityId is provided
  const getInitialUniversity = () => {
    if (selectedUniversityId && cityData?.universities) {
      const university = cityData.universities.find(uni => uni.id === selectedUniversityId);
      return university?.name || "";
    }
    return "";
  };
  
  const [selectedUniversity, setSelectedUniversity] = useState(getInitialUniversity());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMessenger, setShowMessenger] = useState(false);
  const [selectedRideForMessaging, setSelectedRideForMessaging] = useState<GroupRide | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const universities = cityData?.universities || [];

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

  const handleDeleteRide = async (rideId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete your ride.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('group_rides')
        .delete()
        .eq('id', rideId)
        .eq('creator_id', currentUser.id);

      if (error) throw error;

      toast({
        title: "Ride deleted",
        description: "Your group ride has been removed.",
      });

      queryClient.invalidateQueries({ queryKey: ['group-rides'] });
    } catch (error) {
      console.error('Error deleting ride:', error);
      toast({
        title: "Failed to delete ride",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleToggleRecurring = async (rideId: string, currentRecurring: boolean) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to modify your ride.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updateData: any = {
        is_recurring: !currentRecurring,
        updated_at: new Date().toISOString()
      };

      // If making recurring, set a default pattern
      if (!currentRecurring) {
        updateData.recurrence_pattern = 'weekly';
        // Calculate next occurrence (same time next week)
        const currentTime = new Date();
        const nextWeek = new Date(currentTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        updateData.next_occurrence = nextWeek.toISOString();
      } else {
        updateData.recurrence_pattern = null;
        updateData.next_occurrence = null;
      }

      const { error } = await supabase
        .from('group_rides')
        .update(updateData)
        .eq('id', rideId)
        .eq('creator_id', currentUser.id);

      if (error) throw error;

      toast({
        title: currentRecurring ? "Recurring disabled" : "Recurring enabled",
        description: currentRecurring 
          ? "This ride will no longer repeat." 
          : "This ride will now repeat weekly.",
      });

      queryClient.invalidateQueries({ queryKey: ['group-rides'] });
    } catch (error) {
      console.error('Error toggling recurring:', error);
      toast({
        title: "Failed to update ride",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };


  const handleCreateRide = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required", 
        description: "Please log in to create a group ride.",
        variant: "destructive"
      });
      return;
    }

    // Check if user has public profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_public_profile')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (!profile?.is_public_profile) {
      toast({
        title: "Public profile required",
        description: "You must have a public profile to create rides. Update your profile settings.",
        variant: "destructive"
      });
      return;
    }

    setShowCreateForm(true);
  };

  const handleCreateRideFromCard = async (rideUniversity: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required", 
        description: "Please log in to create a group ride.",
        variant: "destructive"
      });
      return;
    }

    // Check if user has public profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_public_profile')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (!profile?.is_public_profile) {
      toast({
        title: "Public profile required",
        description: "You must have a public profile to create rides. Update your profile settings.",
        variant: "destructive"
      });
      return;
    }

    // Pre-select the university from the clicked ride
    setSelectedUniversity(rideUniversity);
    setShowCreateForm(true);
  };

  const handleViewProfile = (userId: string) => {
    setSelectedProfileUserId(userId);
    setShowProfile(true);
  };


  const handleJoinRide = async (rideId: string, rideUniversity: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to join a group ride.",
        variant: "destructive"
      });
      return;
    }

    // Check if user has public profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_public_profile')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (!profile?.is_public_profile) {
      toast({
        title: "Public profile required",
        description: "You must have a public profile to join rides. Update your profile settings.",
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
          selectedUniversity={selectedUniversity}
          cityData={cityData}
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
              {universities.map(uni => (
                <Button
                  key={uni.id}
                  variant={selectedUniversity === uni.name ? "chicago" : "chicago-outline"}
                  size="default"
                  onClick={() => setSelectedUniversity(uni.name)}
                  className="h-12 text-sm font-medium text-left justify-start px-4"
                >
                  {uni.name}
                </Button>
              ))}
            </div>
          </div>
          
          <Button 
            variant="chicago" 
            size="lg"
            onClick={handleCreateRide}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Ride
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
        
        {/* Campus Security Information */}
        {selectedUniversity && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
                <Phone className="w-4 h-4" />
                Campus Security - {selectedUniversity}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const security = getCampusSecurity(selectedUniversity);
                if (security) {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-xs font-medium text-blue-700 mb-1">Emergency</p>
                        <a 
                          href={`tel:${security.emergency}`}
                          className="text-lg font-bold text-blue-800 hover:underline"
                        >
                          {security.emergency}
                        </a>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-blue-700 mb-1">Security</p>
                        <a 
                          href={`tel:${security.security}`}
                          className="text-lg font-bold text-blue-800 hover:underline"
                        >
                          {security.security}
                        </a>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-blue-700 mb-1">Escort Service</p>
                        <a 
                          href={`tel:${security.escort}`}
                          className="text-lg font-bold text-blue-800 hover:underline"
                        >
                          {security.escort}
                        </a>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <p className="text-sm text-blue-700">
                      Contact your campus security for emergency assistance.
                    </p>
                  );
                }
              })()}
            </CardContent>
          </Card>
        )}
        
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
                       <Avatar className="cursor-pointer" onClick={() => handleViewProfile(ride.creator_id)}>
                         <AvatarFallback className="bg-chicago-light-blue text-chicago-dark-blue">
                           {ride.creator_name[0]?.toUpperCase() || 'A'}
                         </AvatarFallback>
                       </Avatar>
                       <div>
                         <button 
                           className="font-medium hover:text-chicago-blue hover:underline text-left"
                           onClick={() => handleViewProfile(ride.creator_id)}
                         >
                           {ride.creator_name}
                         </button>
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
                       {ride.is_recurring && (
                         <Badge variant="outline" className="border-orange-500 text-orange-700">
                           <Repeat className="w-3 h-3 mr-1" />
                           Recurring
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
                   {/* Member Controls - Show messaging if user is part of ride */}
                   {(currentUser && (ride.is_member || ride.creator_id === currentUser.id)) && (
                     <Button 
                       variant="outline"
                       size="sm" 
                       className="w-full mb-2"
                       onClick={() => {
                         setSelectedRideForMessaging(ride);
                         setShowMessenger(true);
                       }}
                     >
                       <MessageSquare className="w-3 h-3 mr-1" />
                       Group Chat
                     </Button>
                   )}
                   
                   {/* Creator Controls */}
                   {currentUser && ride.creator_id === currentUser.id ? (
                     <div className="flex gap-2 mb-3">
                       <Button 
                         variant="outline"
                         size="sm" 
                         className="flex-1"
                         onClick={() => handleToggleRecurring(ride.id, ride.is_recurring)}
                       >
                         <Repeat className="w-3 h-3 mr-1" />
                         {ride.is_recurring ? "Stop Recurring" : "Make Recurring"}
                       </Button>
                       <Button 
                         variant="destructive"
                         size="sm" 
                         onClick={() => handleDeleteRide(ride.id)}
                       >
                         <Trash2 className="w-3 h-3" />
                       </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mb-3">
                        <Button 
                          variant={ride.is_member ? "outline" : "chicago-outline"}
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleJoinRide(ride.id, ride.university_name)}
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
                        <Button 
                          variant="outline"
                          size="sm" 
                          onClick={() => handleCreateRideFromCard(ride.university_name)}
                          disabled={!currentUser}
                          className="px-3"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                 </CardContent>
               </Card>
             );
           })
         )}
       </div>
       
       {/* Messaging Modal */}
       {showMessenger && selectedRideForMessaging && (
         <GroupRideMessenger
           rideId={selectedRideForMessaging.id}
           rideTitle={`${selectedRideForMessaging.cta_line} - ${selectedRideForMessaging.station_name}`}
           onClose={() => {
             setShowMessenger(false);
             setSelectedRideForMessaging(null);
           }}
         />
        )}
        
        {/* Profile View Modal */}
        <ProfileView
          userId={selectedProfileUserId}
          isOpen={showProfile}
          onClose={() => {
            setShowProfile(false);
            setSelectedProfileUserId("");
          }}
        />
      </div>
  );
};