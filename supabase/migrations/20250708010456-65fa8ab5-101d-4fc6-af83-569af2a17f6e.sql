-- First check what incident types are being used
SELECT DISTINCT incident_type FROM incident_reports;

-- Add SOS Emergency as a valid incident type if it doesn't exist
-- Since this table doesn't have constraints on incident_type, we just need to ensure it works
-- Let's also add a test SOS incident to verify the system works

INSERT INTO incident_reports (
  reporter_id,
  incident_type, 
  transit_line,
  location_name,
  description,
  latitude,
  longitude,
  status
) VALUES (
  'test-user',
  'SOS Emergency',
  'Chicago CTA', 
  'SOS incident reported Chicago CTA',
  '🚨 SOS EMERGENCY: Test SOS incident to verify system functionality',
  41.8781,
  -87.6298,
  'active'
);