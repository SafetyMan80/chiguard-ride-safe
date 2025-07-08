-- Add 'SOS Emergency' to the valid incident types
ALTER TABLE incident_reports 
DROP CONSTRAINT valid_incident_type;

ALTER TABLE incident_reports 
ADD CONSTRAINT valid_incident_type 
CHECK (incident_type = ANY (ARRAY[
  'Harassment'::text, 
  'Theft/Pickpocketing'::text, 
  'Assault'::text, 
  'Public Indecency'::text, 
  'Suspicious Activity'::text, 
  'Medical Emergency'::text, 
  'Safety Concern'::text, 
  'SOS Emergency'::text,
  'Other'::text
]));