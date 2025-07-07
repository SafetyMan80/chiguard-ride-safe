-- Add email domain validation function and update verification system
-- First, create a function to validate university email domains
CREATE OR REPLACE FUNCTION public.validate_university_email(email_address TEXT)
RETURNS TABLE(
  is_student_email BOOLEAN,
  university_name TEXT,
  university_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as is_student_email,
    u.name as university_name,
    u.id as university_id
  FROM public.universities u
  WHERE u.domain IS NOT NULL 
    AND email_address ILIKE '%@' || u.domain;
    
  -- If no match found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles table to include verification method and auto-verification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified_university TEXT,
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'none' CHECK (verification_method IN ('none', 'email_domain', 'manual_id')),
ADD COLUMN IF NOT EXISTS auto_verified_at TIMESTAMP WITH TIME ZONE;

-- Create trigger function to auto-verify student status based on email domain
CREATE OR REPLACE FUNCTION public.auto_verify_student_email()
RETURNS TRIGGER AS $$
DECLARE
  domain_validation RECORD;
BEGIN
  -- Only check for email domain validation if student_status is true
  IF NEW.student_status = TRUE AND NEW.email IS NOT NULL THEN
    -- Check if email domain matches a university
    SELECT * INTO domain_validation 
    FROM public.validate_university_email(NEW.email);
    
    IF domain_validation.is_student_email THEN
      -- Auto-verify the student
      NEW.verification_status := 'verified';
      NEW.verification_method := 'email_domain';
      NEW.email_verified_university := domain_validation.university_name;
      NEW.auto_verified_at := now();
      
      -- If university_name is not set, set it from email domain
      IF NEW.university_name IS NULL OR NEW.university_name = '' THEN
        NEW.university_name := domain_validation.university_name;
      END IF;
    ELSE
      -- Email domain doesn't match, keep as pending
      NEW.verification_status := 'pending';
      NEW.verification_method := 'none';
    END IF;
  ELSIF NEW.student_status = FALSE THEN
    -- Not a student, mark as verified
    NEW.verification_status := 'verified';
    NEW.verification_method := 'none';
    NEW.email_verified_university := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-verification
DROP TRIGGER IF EXISTS auto_verify_student_email_trigger ON public.profiles;
CREATE TRIGGER auto_verify_student_email_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_verify_student_email();

-- Update existing profiles to validate against email domains
UPDATE public.profiles 
SET 
  verification_status = CASE 
    WHEN student_status = TRUE THEN
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM public.validate_university_email(email) 
          WHERE is_student_email = TRUE
        ) THEN 'verified'
        ELSE 'pending'
      END
    ELSE 'verified'
  END,
  verification_method = CASE 
    WHEN student_status = TRUE THEN
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM public.validate_university_email(email) 
          WHERE is_student_email = TRUE
        ) THEN 'email_domain'
        ELSE 'none'
      END
    ELSE 'none'
  END,
  email_verified_university = CASE 
    WHEN student_status = TRUE THEN
      (SELECT university_name FROM public.validate_university_email(email) WHERE is_student_email = TRUE LIMIT 1)
    ELSE NULL
  END,
  auto_verified_at = CASE 
    WHEN student_status = TRUE AND EXISTS (
      SELECT 1 FROM public.validate_university_email(email) 
      WHERE is_student_email = TRUE
    ) THEN now()
    ELSE NULL
  END
WHERE email IS NOT NULL;