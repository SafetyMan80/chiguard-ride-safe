-- Add RLS policy to allow reporters to delete their own incident reports
CREATE POLICY "Reporters can delete their own reports" 
ON public.incident_reports 
FOR DELETE 
USING (auth.uid() = reporter_id);

-- Update the function to make reports anonymous by default
CREATE OR REPLACE FUNCTION public.get_incident_reports_with_reporter()
 RETURNS TABLE(id uuid, reporter_id uuid, incident_type text, cta_line text, location_name text, description text, latitude numeric, longitude numeric, accuracy numeric, image_url text, created_at timestamp with time zone, updated_at timestamp with time zone, status text, reporter_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ir.id,
    ir.reporter_id,
    ir.incident_type,
    ir.cta_line,
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
$function$