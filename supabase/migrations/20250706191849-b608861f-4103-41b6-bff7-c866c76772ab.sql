-- First, drop the existing function
DROP FUNCTION IF EXISTS public.get_incident_reports_with_reporter();

-- Rename the cta_line column to transit_line to be more generic and support all cities
ALTER TABLE public.incident_reports 
RENAME COLUMN cta_line TO transit_line;

-- Create the updated database function with the new column name
CREATE OR REPLACE FUNCTION public.get_incident_reports_with_reporter()
 RETURNS TABLE(id uuid, reporter_id uuid, incident_type text, transit_line text, location_name text, description text, latitude numeric, longitude numeric, accuracy numeric, image_url text, created_at timestamp with time zone, updated_at timestamp with time zone, status text, reporter_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ir.id,
    ir.reporter_id,
    ir.incident_type,
    ir.transit_line,
    ir.location_name,
    ir.description,
    ir.latitude,
    ir.longitude,
    ir.accuracy,
    ir.image_url,
    ir.created_at,
    ir.updated_at,
    ir.status,
    'Anonymous User' as reporter_name -- Always show as anonymous
  FROM public.incident_reports ir
  WHERE ir.status = 'active'
  ORDER BY ir.created_at DESC;
END;
$function$;