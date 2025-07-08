-- Add Boston MBTA lines to the valid transit line constraint
ALTER TABLE incident_reports 
DROP CONSTRAINT valid_transit_line;

ALTER TABLE incident_reports 
ADD CONSTRAINT valid_transit_line 
CHECK (transit_line = ANY (ARRAY[
  -- Existing CTA Lines
  'Red Line'::text, 'Blue Line'::text, 'Brown Line'::text, 'Green Line'::text, 
  'Orange Line'::text, 'Pink Line'::text, 'Purple Line'::text, 'Yellow Line'::text,
  -- NYC Subway Lines
  '4'::text, '5'::text, '6'::text, '7'::text, 'A'::text, 'B'::text, 'C'::text, 'D'::text, 
  'E'::text, 'F'::text, 'G'::text, 'J'::text, 'L'::text, 'M'::text, 'N'::text, 'Q'::text, 
  'R'::text, 'W'::text, 'Z'::text,
  -- Denver RTD Lines
  'A Line'::text, 'B Line'::text, 'C Line'::text, 'D Line'::text, 'E Line'::text, 
  'F Line'::text, 'G Line'::text, 'H Line'::text, 'N Line'::text, 'R Line'::text, 'W Line'::text,
  -- DC Metro Lines
  'Red Line'::text, 'Blue Line'::text, 'Orange Line'::text, 'Silver Line'::text, 
  'Green Line'::text, 'Yellow Line'::text,
  -- SEPTA Lines
  'Market-Frankford Line'::text, 'Broad Street Line'::text, 'Regional Rail'::text,
  -- MARTA Lines
  'Red Line'::text, 'Gold Line'::text, 'Blue Line'::text, 'Green Line'::text,
  -- Boston MBTA Lines (NEW)
  'Red Line'::text, 'Blue Line'::text, 'Orange Line'::text, 'Green Line'::text, 'Silver Line'::text,
  -- SOS Emergency Transit Authorities
  'Chicago CTA'::text, 'NYC MTA'::text, 'DC Metro'::text, 'SEPTA'::text, 'MARTA'::text, 'Boston MBTA'::text
]));