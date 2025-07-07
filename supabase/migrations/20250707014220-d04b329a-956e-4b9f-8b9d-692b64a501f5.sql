-- Create analytics table for tracking user events
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own events
CREATE POLICY "Users can track their own events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins to view all analytics (assuming you have admin role setup)
CREATE POLICY "Admins can view all analytics" 
ON public.analytics_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to track events easily
CREATE OR REPLACE FUNCTION public.track_event(
  _event_type TEXT,
  _event_data JSONB DEFAULT '{}',
  _user_agent TEXT DEFAULT NULL,
  _ip_address INET DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.analytics_events (
    user_id,
    event_type,
    event_data,
    user_agent,
    ip_address
  ) VALUES (
    auth.uid(),
    _event_type,
    _event_data,
    _user_agent,
    _ip_address
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_analytics_events_type_created ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_events_user_created ON public.analytics_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;