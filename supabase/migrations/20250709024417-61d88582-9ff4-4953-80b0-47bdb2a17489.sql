-- Enable real-time for group_messages table
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;

-- Add group_messages table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;