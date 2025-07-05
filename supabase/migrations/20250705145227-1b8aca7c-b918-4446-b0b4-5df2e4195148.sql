-- Drop and recreate the get_available_spots function to fix ambiguous column references
DROP FUNCTION public.get_available_spots(uuid);

CREATE OR REPLACE FUNCTION public.get_available_spots(ride_id_param uuid)
RETURNS integer AS $$
DECLARE
  max_spots_val INTEGER;
  current_members_val INTEGER;
BEGIN
  SELECT gr.max_spots INTO max_spots_val
  FROM public.group_rides gr
  WHERE gr.id = ride_id_param;
  
  SELECT COUNT(*) INTO current_members_val
  FROM public.group_ride_members grm
  WHERE grm.ride_id = ride_id_param AND grm.status = 'joined';
  
  RETURN COALESCE(max_spots_val, 0) - COALESCE(current_members_val, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;