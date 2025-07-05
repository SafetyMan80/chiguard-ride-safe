-- Update the trigger function to use the corrected get_available_spots function
CREATE OR REPLACE FUNCTION public.update_ride_status_if_full()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ride status to 'full' if no spots available
  UPDATE public.group_rides 
  SET status = 'full', updated_at = now()
  WHERE id = COALESCE(NEW.ride_id, OLD.ride_id)
    AND status = 'active'
    AND public.get_available_spots(COALESCE(NEW.ride_id, OLD.ride_id)) <= 0;
    
  -- Update ride status back to 'active' if spots become available
  UPDATE public.group_rides 
  SET status = 'active', updated_at = now()
  WHERE id = COALESCE(NEW.ride_id, OLD.ride_id)
    AND status = 'full'
    AND public.get_available_spots(COALESCE(NEW.ride_id, OLD.ride_id)) > 0;
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;