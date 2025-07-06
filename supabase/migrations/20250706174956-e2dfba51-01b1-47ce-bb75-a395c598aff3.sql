-- Add university-specific validation fields to id_verifications table
ALTER TABLE public.id_verifications 
ADD COLUMN university_name TEXT,
ADD COLUMN student_id_number TEXT,
ADD COLUMN verification_notes TEXT,
ADD COLUMN admin_verified_by UUID,
ADD COLUMN verification_score INTEGER DEFAULT 0;

-- Add index for university lookups
CREATE INDEX idx_id_verifications_university ON public.id_verifications(university_name);
CREATE INDEX idx_id_verifications_student_id ON public.id_verifications(student_id_number);

-- Create university verification log table for audit trail
CREATE TABLE public.university_verification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES public.id_verifications(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'approved', 'rejected', 'flagged'
  reason TEXT,
  confidence_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for verification logs
ALTER TABLE public.university_verification_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage verification logs
CREATE POLICY "Admins can manage verification logs" 
ON public.university_verification_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Add trigger to update verification score based on validation
CREATE OR REPLACE FUNCTION public.calculate_verification_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Basic scoring logic (can be enhanced with ML/AI validation)
  NEW.verification_score := CASE 
    WHEN NEW.verification_status = 'verified' THEN 100
    WHEN NEW.verification_status = 'pending' THEN 50
    WHEN NEW.verification_status = 'rejected' THEN 0
    ELSE 25
  END;
  
  -- Additional scoring based on university match
  IF NEW.university_name IS NOT NULL AND NEW.university_name != '' THEN
    NEW.verification_score := NEW.verification_score + 10;
  END IF;
  
  -- Additional scoring based on student ID number
  IF NEW.student_id_number IS NOT NULL AND NEW.student_id_number != '' THEN
    NEW.verification_score := NEW.verification_score + 10;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic score calculation
CREATE TRIGGER update_verification_score
  BEFORE INSERT OR UPDATE ON public.id_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_verification_score();