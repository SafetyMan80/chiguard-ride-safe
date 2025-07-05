-- Create group_rides table
CREATE TABLE public.group_rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  university_name TEXT NOT NULL,
  cta_line TEXT NOT NULL,
  station_name TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_spots INTEGER NOT NULL DEFAULT 4,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'full', 'departed', 'cancelled'))
);

-- Create group_ride_members table
CREATE TABLE public.group_ride_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.group_rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'joined',
  UNIQUE(ride_id, user_id),
  CONSTRAINT valid_member_status CHECK (status IN ('joined', 'left'))
);

-- Enable Row Level Security
ALTER TABLE public.group_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_ride_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_rides
CREATE POLICY "Anyone can view active group rides" 
ON public.group_rides 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can create their own group rides" 
ON public.group_rides 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own group rides" 
ON public.group_rides 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- RLS Policies for group_ride_members
CREATE POLICY "Anyone can view group ride members" 
ON public.group_ride_members 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join group rides" 
ON public.group_ride_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" 
ON public.group_ride_members 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_group_rides_updated_at
BEFORE UPDATE ON public.group_rides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get available spots for a ride
CREATE OR REPLACE FUNCTION public.get_available_spots(ride_id UUID)
RETURNS INTEGER AS $$
DECLARE
  max_spots INTEGER;
  current_members INTEGER;
BEGIN
  SELECT gr.max_spots INTO max_spots
  FROM public.group_rides gr
  WHERE gr.id = ride_id;
  
  SELECT COUNT(*) INTO current_members
  FROM public.group_ride_members grm
  WHERE grm.ride_id = ride_id AND grm.status = 'joined';
  
  RETURN COALESCE(max_spots, 0) - COALESCE(current_members, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to automatically update ride status when full
CREATE OR REPLACE FUNCTION public.update_ride_status_if_full()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ride status to 'full' if no spots available
  UPDATE public.group_rides 
  SET status = 'full', updated_at = now()
  WHERE id = NEW.ride_id 
    AND status = 'active'
    AND public.get_available_spots(NEW.ride_id) <= 0;
    
  -- Update ride status back to 'active' if spots become available
  UPDATE public.group_rides 
  SET status = 'active', updated_at = now()
  WHERE id = COALESCE(NEW.ride_id, OLD.ride_id)
    AND status = 'full'
    AND public.get_available_spots(COALESCE(NEW.ride_id, OLD.ride_id)) > 0;
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to auto-update ride status
CREATE TRIGGER update_ride_status_on_member_change
AFTER INSERT OR UPDATE OR DELETE ON public.group_ride_members
FOR EACH ROW EXECUTE FUNCTION public.update_ride_status_if_full();