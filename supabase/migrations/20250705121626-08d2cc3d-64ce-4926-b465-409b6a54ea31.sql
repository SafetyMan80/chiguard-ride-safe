-- Create incident_reports table
CREATE TABLE public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  incident_type TEXT NOT NULL,
  cta_line TEXT NOT NULL,
  location_name TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude DECIMAL,
  longitude DECIMAL,
  accuracy DECIMAL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  CONSTRAINT valid_incident_type CHECK (incident_type IN (
    'Harassment', 'Theft/Pickpocketing', 'Assault', 'Public Indecency', 
    'Suspicious Activity', 'Medical Emergency', 'Safety Concern', 'Other'
  )),
  CONSTRAINT valid_cta_line CHECK (cta_line IN (
    'Red Line', 'Blue Line', 'Green Line', 'Brown Line', 
    'Orange Line', 'Purple Line', 'Pink Line', 'Yellow Line'
  )),
  CONSTRAINT valid_status CHECK (status IN ('active', 'resolved', 'investigating'))
);

-- Enable Row Level Security
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incident_reports
CREATE POLICY "Anyone can view active incident reports" 
ON public.incident_reports 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can create incident reports" 
ON public.incident_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can update their own reports" 
ON public.incident_reports 
FOR UPDATE 
USING (auth.uid() = reporter_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_incident_reports_updated_at
BEFORE UPDATE ON public.incident_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get incident reports with reporter info
CREATE OR REPLACE FUNCTION public.get_incident_reports_with_reporter()
RETURNS TABLE (
  id UUID,
  reporter_id UUID,
  incident_type TEXT,
  cta_line TEXT,
  location_name TEXT,
  description TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  accuracy DECIMAL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  reporter_name TEXT
) AS $$
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
    COALESCE(p.full_name, 'Anonymous User') as reporter_name
  FROM public.incident_reports ir
  LEFT JOIN public.profiles p ON ir.reporter_id = p.user_id
  WHERE ir.status = 'active'
  ORDER BY ir.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;