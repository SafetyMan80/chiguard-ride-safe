import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGroupRides = (city?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for group rides
  const {
    data: rides = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['group-rides', city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_rides')
        .select('*')
        .eq('status', 'active')
        .order('departure_time', { ascending: true })
        .limit(50); // Pagination

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Real-time subscription
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
        (payload) => {
          console.log('Group ride change:', payload);
          // Invalidate and refetch the query
          queryClient.invalidateQueries({ queryKey: ['group-rides'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Join ride mutation
  const joinRideMutation = useMutation({
    mutationFn: async (rideId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('group_ride_members')
        .insert({
          ride_id: rideId,
          user_id: user.id,
          status: 'joined'
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate group rides and members queries
      queryClient.invalidateQueries({ queryKey: ['group-rides'] });
      queryClient.invalidateQueries({ queryKey: ['ride-members'] });
      toast({
        title: "Joined ride!",
        description: "You've successfully joined the group ride.",
      });
    },
    onError: (error) => {
      console.error('Error joining ride:', error);
      toast({
        title: "Failed to join ride",
        description: "You may have already joined this ride.",
        variant: "destructive"
      });
    }
  });

  return {
    rides,
    isLoading,
    error,
    refetch,
    joinRide: joinRideMutation.mutate,
    isJoining: joinRideMutation.isPending
  };
};

export const useGeneralGroupRides = (searchLocation?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: rides = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['general-group-rides', searchLocation],
    queryFn: async () => {
      let query = supabase
        .from('general_group_rides')
        .select('*')
        .eq('status', 'active')
        .order('departure_time', { ascending: true })
        .limit(50);

      if (searchLocation) {
        query = query.or(`departure_location.ilike.%${searchLocation}%,destination_location.ilike.%${searchLocation}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get member counts and check if user is member
      const ridesWithMembers = await Promise.all(
        (data || []).map(async (ride) => {
          const { count } = await supabase
            .from('general_ride_members')
            .select('*', { count: 'exact', head: true })
            .eq('ride_id', ride.id)
            .eq('status', 'joined');

          const { data: { user } } = await supabase.auth.getUser();
          let is_member = false;
          if (user) {
            const { data: memberData } = await supabase
              .from('general_ride_members')
              .select('id')
              .eq('ride_id', ride.id)
              .eq('user_id', user.id)
              .eq('status', 'joined')
              .maybeSingle();
            is_member = !!memberData;
          }

          return { ...ride, current_members: count || 0, is_member };
        })
      );

      return ridesWithMembers;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('general-rides-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'general_group_rides'
        },
        () => queryClient.invalidateQueries({ queryKey: ['general-group-rides'] })
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'general_ride_members'
        },
        () => queryClient.invalidateQueries({ queryKey: ['general-group-rides'] })
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  return { rides, isLoading, error, refetch };
};