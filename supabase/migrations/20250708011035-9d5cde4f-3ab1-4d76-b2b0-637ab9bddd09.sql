-- Add the SOS emergency transit authority names to the valid transit lines
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
  -- LA Metro Lines
  'A Line'::text, 'B Line'::text, 'C Line'::text, 'D Line'::text, 'E Line'::text, 
  'F Line'::text, 'G Line'::text, 'H Line'::text, 'N Line'::text, 'R Line'::text, 'W Line'::text,
  -- DC Metro Lines
  'Red Line'::text, 'Blue Line'::text, 'Orange Line'::text, 'Silver Line'::text, 
  'Green Line'::text, 'Yellow Line'::text,
  -- SEPTA Lines
  'Market-Frankford Line'::text, 'Broad Street Line'::text, 'Regional Rail'::text,
  -- MARTA Lines
  'Red Line'::text, 'Gold Line'::text, 'Blue Line'::text, 'Green Line'::text,
  -- SOS Emergency Transit Authorities (NEW)
  'Chicago CTA'::text, 'NYC MTA'::text, 'DC Metro'::text, 'SEPTA'::text, 'MARTA'::text
]));