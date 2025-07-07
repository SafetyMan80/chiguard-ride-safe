import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaginationParams {
  page?: number;
  limit?: number;
}

export const useMessages = (rideId: string, { page = 0, limit = 50 }: PaginationParams = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: messages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['messages', rideId, page, limit],
    queryFn: async () => {
      const offset = page * limit;
      
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          id,
          sender_id,
          message_text,
          message_type,
          created_at,
          is_read
        `)
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 1000, // 5 seconds for messages
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    enabled: !!rideId,
  });

  // Get total count for pagination
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['messages-count', rideId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('group_messages')
        .select('*', { count: 'exact', head: true })
        .eq('ride_id', rideId);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 30 * 1000,
    enabled: !!rideId,
  });

  // Real-time subscription for messages
  useEffect(() => {
    if (!rideId) return;

    const channel = supabase
      .channel(`messages-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_messages',
          filter: `ride_id=eq.${rideId}`
        },
        (payload) => {
          console.log('Message change:', payload);
          queryClient.invalidateQueries({ queryKey: ['messages', rideId] });
          
          // Show toast for new messages from others
          if (payload.eventType === 'INSERT' && payload.new.sender_id !== supabase.auth.getUser().then(u => u.data.user?.id)) {
            toast({
              title: "New Message",
              description: "You have a new message in your group ride.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [rideId, queryClient, toast]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, messageType = 'text' }: { message: string; messageType?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          ride_id: rideId,
          sender_id: user.id,
          message_text: message,
          message_type: messageType
        })
        .select(`
          id,
          sender_id,
          message_text,
          message_type,
          created_at
        `);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', rideId] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    messages,
    isLoading,
    error,
    refetch,
    totalCount,
    hasNextPage: (page + 1) * limit < totalCount,
    hasPreviousPage: page > 0,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending
  };
};