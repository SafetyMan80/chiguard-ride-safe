-- Check what incident types exist
SELECT DISTINCT incident_type FROM incident_reports;

-- Add a test SOS incident with proper UUID format
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
  gen_random_uuid(),
  'SOS Emergency',
  'Chicago CTA', 
  'SOS incident reported Chicago CTA',
  '🚨 SOS EMERGENCY: Test SOS incident to verify system functionality',
  41.8781,
  -87.6298,
  'active'
);