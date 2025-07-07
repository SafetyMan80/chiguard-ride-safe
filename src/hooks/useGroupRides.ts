import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaginationParams {
  page?: number;
  limit?: number;
}

export const useGroupRides = (city?: string, { page = 0, limit = 20 }: PaginationParams = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Optimized query for group rides with pagination and specific fields
  const {
    data: rides = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['group-rides', city, page, limit],
    queryFn: async () => {
      const offset = page * limit;
      
      const { data, error } = await supabase
        .from('group_rides')
        .select(`
          id,
          creator_id,
          cta_line,
          station_name,
          university_name,
          departure_time,
          max_spots,
          description,
          status,
          created_at
        `)
        .eq('status', 'active')
        .order('departure_time', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Get total count for pagination
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['group-rides-count', city],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('group_rides')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    },
    staleTime: 60 * 1000, // 1 minute
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
      // Handle async cleanup properly
      supabase.removeChannel(channel).catch(console.error);
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
        .select('id, ride_id, user_id, status');

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
    totalCount,
    hasNextPage: (page + 1) * limit < totalCount,
    hasPreviousPage: page > 0,
    joinRide: joinRideMutation.mutate,
    isJoining: joinRideMutation.isPending
  };
};

export const useGeneralGroupRides = (searchLocation?: string, { page = 0, limit = 20 }: PaginationParams = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: rides = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['general-group-rides', searchLocation, page, limit],
    queryFn: async () => {
      const offset = page * limit;
      
      let query = supabase
        .from('general_group_rides')
        .select(`
          id,
          creator_id,
          title,
          departure_location,
          destination_location,
          departure_time,
          max_spots,
          description,
          status,
          created_at
        `)
        .eq('status', 'active')
        .order('departure_time', { ascending: true })
        .range(offset, offset + limit - 1);

      if (searchLocation) {
        query = query.or(`departure_location.ilike.%${searchLocation}%,destination_location.ilike.%${searchLocation}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get member counts efficiently using a single query per ride
      const ridesWithMembers = await Promise.all(
        (data || []).map(async (ride) => {
          const { data: { user } } = await supabase.auth.getUser();
          
          const [{ count }, memberData] = await Promise.all([
            supabase
              .from('general_ride_members')
              .select('*', { count: 'exact', head: true })
              .eq('ride_id', ride.id)
              .eq('status', 'joined'),
            user ? supabase
              .from('general_ride_members')
              .select('id')
              .eq('ride_id', ride.id)
              .eq('user_id', user.id)
              .eq('status', 'joined')
              .maybeSingle() : Promise.resolve({ data: null })
          ]);

          return { 
            ...ride, 
            current_members: count || 0, 
            is_member: !!memberData.data 
          };
        })
      );

      return ridesWithMembers;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Get total count for pagination
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['general-group-rides-count', searchLocation],
    queryFn: async () => {
      let query = supabase
        .from('general_group_rides')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (searchLocation) {
        query = query.or(`departure_location.ilike.%${searchLocation}%,destination_location.ilike.%${searchLocation}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    staleTime: 60 * 1000,
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

    return () => {
      // Handle async cleanup properly
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [queryClient]);

  return { 
    rides, 
    isLoading, 
    error, 
    refetch,
    totalCount,
    hasNextPage: (page + 1) * limit < totalCount,
    hasPreviousPage: page > 0,
  };
};

// Infinite scroll hook for better UX
export const useInfiniteGroupRides = (city?: string) => {
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['infinite-group-rides', city],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      const offset = pageParam * limit;
      
      const { data, error } = await supabase
        .from('group_rides')
        .select(`
          id,
          creator_id,
          cta_line,
          station_name,
          university_name,
          departure_time,
          max_spots,
          description,
          status,
          created_at
        `)
        .eq('status', 'active')
        .order('departure_time', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], nextPage: data && data.length === limit ? pageParam + 1 : null };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 30 * 1000,
    initialPageParam: 0,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('infinite-group-rides-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_rides'
        },
        () => queryClient.invalidateQueries({ queryKey: ['infinite-group-rides'] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [queryClient]);

  const rides = data?.pages.flatMap(page => page.data) || [];

  return {
    rides,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  };
};