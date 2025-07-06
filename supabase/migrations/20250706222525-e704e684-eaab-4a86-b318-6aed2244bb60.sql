-- Create messages table for group ride communications
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message_type TEXT NOT NULL DEFAULT 'text',
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX idx_group_messages_ride_id ON public.group_messages(ride_id);
CREATE INDEX idx_group_messages_sender_id ON public.group_messages(sender_id);
CREATE INDEX idx_group_messages_created_at ON public.group_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_messages
-- Users can only view messages from rides they are members of
CREATE POLICY "Users can view messages from their group rides" 
ON public.group_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_ride_members grm 
    WHERE grm.ride_id = group_messages.ride_id 
    AND grm.user_id = auth.uid() 
    AND grm.status = 'joined'
  ) OR
  EXISTS (
    SELECT 1 FROM public.group_rides gr 
    WHERE gr.id = group_messages.ride_id 
    AND gr.creator_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.general_ride_members grm 
    WHERE grm.ride_id = group_messages.ride_id 
    AND grm.user_id = auth.uid() 
    AND grm.status = 'joined'
  ) OR
  EXISTS (
    SELECT 1 FROM public.general_group_rides gr 
    WHERE gr.id = group_messages.ride_id 
    AND gr.creator_id = auth.uid()
  )
);

-- Users can send messages to rides they are members of
CREATE POLICY "Users can send messages to their group rides" 
ON public.group_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND (
    EXISTS (
      SELECT 1 FROM public.group_ride_members grm 
      WHERE grm.ride_id = group_messages.ride_id 
      AND grm.user_id = auth.uid() 
      AND grm.status = 'joined'
    ) OR
    EXISTS (
      SELECT 1 FROM public.group_rides gr 
      WHERE gr.id = group_messages.ride_id 
      AND gr.creator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.general_ride_members grm 
      WHERE grm.ride_id = group_messages.ride_id 
      AND grm.user_id = auth.uid() 
      AND grm.status = 'joined'
    ) OR
    EXISTS (
      SELECT 1 FROM public.general_group_rides gr 
      WHERE gr.id = group_messages.ride_id 
      AND gr.creator_id = auth.uid()
    )
  )
);

-- Users can update their own messages (for read status)
CREATE POLICY "Users can update message read status" 
ON public.group_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.group_ride_members grm 
    WHERE grm.ride_id = group_messages.ride_id 
    AND grm.user_id = auth.uid() 
    AND grm.status = 'joined'
  ) OR
  EXISTS (
    SELECT 1 FROM public.group_rides gr 
    WHERE gr.id = group_messages.ride_id 
    AND gr.creator_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.general_ride_members grm 
    WHERE grm.ride_id = group_messages.ride_id 
    AND grm.user_id = auth.uid() 
    AND grm.status = 'joined'
  ) OR
  EXISTS (
    SELECT 1 FROM public.general_group_rides gr 
    WHERE gr.id = group_messages.ride_id 
    AND gr.creator_id = auth.uid()
  )
);