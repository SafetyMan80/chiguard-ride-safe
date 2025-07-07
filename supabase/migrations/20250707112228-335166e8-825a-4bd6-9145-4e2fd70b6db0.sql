-- Update incident_reports table to support all transit systems
-- First, drop the old constraint that only allowed CTA lines
ALTER TABLE public.incident_reports DROP CONSTRAINT IF EXISTS valid_cta_line;

-- Add a new constraint that allows all transit lines from all supported cities
ALTER TABLE public.incident_reports 
ADD CONSTRAINT valid_transit_line CHECK (transit_line IN (
  -- Chicago CTA Lines
  'Red Line', 'Blue Line', 'Brown Line', 'Green Line', 'Orange Line', 'Pink Line', 'Purple Line', 'Yellow Line',
  -- NYC MTA Lines  
  '4', '5', '6', '7', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'L', 'M', 'N', 'Q', 'R', 'W', 'Z',
  -- Denver RTD Lines
  'A Line', 'B Line', 'C Line', 'D Line', 'E Line', 'F Line', 'G Line', 'H Line', 'N Line', 'R Line', 'W Line',
  -- Washington DC WMATA Lines
  'Red Line', 'Blue Line', 'Orange Line', 'Silver Line', 'Green Line', 'Yellow Line',
  -- Philadelphia SEPTA Lines
  'Market-Frankford Line', 'Broad Street Line', 'Regional Rail',
  -- Atlanta MARTA Lines
  'Red Line', 'Gold Line', 'Blue Line', 'Green Line'
));