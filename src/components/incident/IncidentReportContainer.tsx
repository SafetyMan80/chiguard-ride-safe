import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IncidentReportForm } from "./IncidentReportForm";
import { IncidentList } from "./IncidentList";
import { IncidentReportData, IncidentReportProps } from "@/types/incident";

const fetchIncidentReports = async (): Promise<IncidentReportData[]> => {
  const { data, error } = await supabase.rpc('get_incident_reports_with_reporter');
  
  if (error) {
    console.error('Error fetching incident reports:', error);
    throw error;
  }
  
  return data || [];
};

export const IncidentReportContainer = ({ selectedCity }: IncidentReportProps) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Fetch incident reports with React Query
  const { data: incidents = [], isLoading, error } = useQuery({
    queryKey: ['incident-reports'],
    queryFn: fetchIncidentReports,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscription
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
        () => {
          queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleDeleteReport = async (reportId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete your report.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('incident_reports')
        .delete()
        .eq('id', reportId)
        .eq('reporter_id', currentUser.id);

      if (error) throw error;

      toast({
        title: "Report deleted",
        description: "Your incident report has been removed.",
      });

      queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Failed to delete report",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Failed to load incident reports. Please try again later.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <IncidentReportForm 
        selectedCity={selectedCity} 
        onSubmitSuccess={handleSubmitSuccess}
      />
      <IncidentList 
        incidents={incidents}
        isLoading={isLoading}
        currentUser={currentUser}
        onDelete={handleDeleteReport}
      />
    </div>
  );
};