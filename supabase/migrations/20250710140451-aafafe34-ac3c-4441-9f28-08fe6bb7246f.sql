-- Delete all test incidents from the database
DELETE FROM public.incident_reports 
WHERE 
  description ILIKE '%test%' 
  OR description ILIKE '%mock%' 
  OR description ILIKE '%testing purposes%'
  OR description ILIKE '%load test%'
  OR location_name ILIKE '%load test%';