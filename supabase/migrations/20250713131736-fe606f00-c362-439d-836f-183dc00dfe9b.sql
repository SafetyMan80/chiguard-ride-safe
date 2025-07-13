-- Update existing group rides to have future departure times for testing
UPDATE public.group_rides 
SET departure_time = NOW() + INTERVAL '2 hours',
    updated_at = NOW()
WHERE status = 'active' AND departure_time < NOW();

-- Insert a test general group ride as well
INSERT INTO public.general_group_rides (
  creator_id,
  title,
  departure_location,
  destination_location,
  departure_time,
  max_spots,
  description,
  status
) VALUES (
  '2d5dd0e3-4208-4766-b2dc-34da1333e010',
  'Shopping Trip Downtown',
  'Union Station',
  'Magnificent Mile',
  NOW() + INTERVAL '3 hours',
  4,
  'Let''s go shopping together!',
  'active'
);