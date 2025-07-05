-- Add recurring ride functionality to group_rides table
ALTER TABLE public.group_rides 
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurrence_pattern TEXT DEFAULT NULL,
ADD COLUMN next_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add RLS policy to allow creators to delete their own rides
CREATE POLICY "Creators can delete their own group rides" 
ON public.group_rides 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Create function to generate next recurring ride
CREATE OR REPLACE FUNCTION public.create_next_recurring_ride(ride_id_param UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  original_ride RECORD;
  new_ride_id UUID;
  next_departure TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the original ride details
  SELECT * INTO original_ride
  FROM public.group_rides
  WHERE id = ride_id_param AND is_recurring = true;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Calculate next departure time based on recurrence pattern
  CASE original_ride.recurrence_pattern
    WHEN 'daily' THEN
      next_departure := original_ride.departure_time + INTERVAL '1 day';
    WHEN 'weekly' THEN
      next_departure := original_ride.departure_time + INTERVAL '1 week';
    WHEN 'monthly' THEN
      next_departure := original_ride.departure_time + INTERVAL '1 month';
    ELSE
      RETURN NULL;
  END CASE;
  
  -- Only create if the next occurrence is in the future
  IF next_departure > NOW() THEN
    -- Create new recurring ride
    INSERT INTO public.group_rides (
      creator_id,
      cta_line,
      station_name,
      university_name,
      departure_time,
      max_spots,
      description,
      is_recurring,
      recurrence_pattern,
      next_occurrence
    ) VALUES (
      original_ride.creator_id,
      original_ride.cta_line,
      original_ride.station_name,
      original_ride.university_name,
      next_departure,
      original_ride.max_spots,
      original_ride.description,
      true,
      original_ride.recurrence_pattern,
      CASE original_ride.recurrence_pattern
        WHEN 'daily' THEN next_departure + INTERVAL '1 day'
        WHEN 'weekly' THEN next_departure + INTERVAL '1 week'
        WHEN 'monthly' THEN next_departure + INTERVAL '1 month'
      END
    ) RETURNING id INTO new_ride_id;
    
    -- Update the original ride's next occurrence
    UPDATE public.group_rides 
    SET next_occurrence = CASE recurrence_pattern
      WHEN 'daily' THEN next_departure + INTERVAL '1 day'
      WHEN 'weekly' THEN next_departure + INTERVAL '1 week'
      WHEN 'monthly' THEN next_departure + INTERVAL '1 month'
    END
    WHERE id = ride_id_param;
    
    RETURN new_ride_id;
  END IF;
  
  RETURN NULL;
END;
$$;