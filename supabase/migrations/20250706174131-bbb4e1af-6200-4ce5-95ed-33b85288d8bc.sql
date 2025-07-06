-- Create general_group_rides table for rides not tied to universities
CREATE TABLE public.general_group_rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  departure_location TEXT NOT NULL,
  destination_location TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_spots INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create general_ride_members table for tracking members in general rides
CREATE TABLE public.general_ride_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.general_group_rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'joined'
);

-- Enable Row Level Security
ALTER TABLE public.general_group_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_ride_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for general_group_rides
CREATE POLICY "Anyone can view active general rides" 
ON public.general_group_rides 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can create their own general rides" 
ON public.general_group_rides 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own general rides" 
ON public.general_group_rides 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own general rides" 
ON public.general_group_rides 
FOR DELETE 
USING (auth.uid() = creator_id);

-- RLS Policies for general_ride_members
CREATE POLICY "Anyone can view general ride members" 
ON public.general_ride_members 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join general rides" 
ON public.general_ride_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own general ride membership" 
ON public.general_ride_members 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_general_group_rides_updated_at
  BEFORE UPDATE ON public.general_group_rides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();