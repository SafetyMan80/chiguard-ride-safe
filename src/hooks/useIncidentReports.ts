import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaginationParams {
  page?: number;
  limit?: number;
}

export const useIncidentReports = (city?: string, { page = 0, limit = 25 }: PaginationParams = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: reports = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['incident-reports', city, page, limit],
    queryFn: async () => {
      const offset = page * limit;
      
      let query = supabase
        .from('incident_reports')
        .select(`
          id,
          reporter_id,
          incident_type,
          transit_line,
          location_name,
          description,
          latitude,
          longitude,
          accuracy,
          image_url,
          status,
          created_at,
          updated_at
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (city) {
        query = query.eq('transit_line', city);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  // Get total count for pagination
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['incident-reports-count', city],
    queryFn: async () => {
      let query = supabase
        .from('incident_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (city) {
        query = query.eq('transit_line', city);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Real-time subscription for incident reports
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
        (payload) => {
          console.log('Incident report change:', payload);
          queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
          
          // Show toast for new incidents
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Safety Alert",
              description: `New incident reported on ${payload.new.transit_line}`,
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    return () => {
      // Handle async cleanup properly
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [queryClient, toast]);

  // Create incident mutation
  const createIncidentMutation = useMutation({
    mutationFn: async (incidentData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('incident_reports')
        .insert({
          ...incidentData,
          reporter_id: user.id
        })
        .select(`
          id,
          incident_type,
          transit_line,
          location_name,
          description,
          status,
          created_at
        `);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
      toast({
        title: "Report submitted",
        description: "Your safety report has been submitted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating incident:', error);
      toast({
        title: "Failed to submit report",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  return {
    reports,
    isLoading,
    error,
    refetch,
    totalCount,
    hasNextPage: (page + 1) * limit < totalCount,
    hasPreviousPage: page > 0,
    createIncident: createIncidentMutation.mutate,
    isCreating: createIncidentMutation.isPending
  };
};

// Infinite scroll for incident reports
export const useInfiniteIncidentReports = (city?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['infinite-incident-reports', city],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 25;
      const offset = pageParam * limit;
      
      let query = supabase
        .from('incident_reports')
        .select(`
          id,
          reporter_id,
          incident_type,
          transit_line,
          location_name,
          description,
          latitude,
          longitude,
          image_url,
          status,
          created_at
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (city) {
        query = query.eq('transit_line', city);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return { 
        data: data || [], 
        nextPage: data && data.length === limit ? pageParam + 1 : null 
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 60 * 1000,
    initialPageParam: 0,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('infinite-incidents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_reports'
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['infinite-incident-reports'] });
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Safety Alert",
              description: `New incident reported on ${payload.new.transit_line}`,
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [queryClient, toast]);

  const reports = data?.pages.flatMap(page => page.data) || [];

  return {
    reports,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  };
};