import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useIncidentReports = (city?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: reports = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['incident-reports', city],
    queryFn: async () => {
      let query = supabase
        .from('incident_reports')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100); // Pagination

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
      supabase.removeChannel(channel);
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
        .select();

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
    createIncident: createIncidentMutation.mutate,
    isCreating: createIncidentMutation.isPending
  };
};