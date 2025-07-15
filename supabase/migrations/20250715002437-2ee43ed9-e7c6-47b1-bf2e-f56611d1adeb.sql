-- Critical Security Fixes (Fixed)

-- 1. Fix privilege escalation vulnerability by adding strict INSERT/UPDATE policies to user_roles
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

-- Only admins can assign roles (prevents privilege escalation)
CREATE POLICY "Only admins can assign roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can modify roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Create secure admin bootstrap function
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Check if any admins exist
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';
  
  -- Only allow if no admins exist
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log the admin bootstrap
    PERFORM public.log_security_audit(
      'ADMIN_BOOTSTRAP',
      'USER_ROLES',
      _user_id,
      jsonb_build_object('first_admin_created', now())
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 3. Create function to prevent system from having zero admins
CREATE OR REPLACE FUNCTION public.prevent_zero_admins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  remaining_admins INTEGER;
BEGIN
  -- Only check on DELETE of admin roles
  IF OLD.role = 'admin' THEN
    SELECT COUNT(*) INTO remaining_admins
    FROM public.user_roles
    WHERE role = 'admin' AND id != OLD.id;
    
    -- Prevent deletion if this would leave zero admins
    IF remaining_admins = 0 THEN
      RAISE EXCEPTION 'Cannot delete the last admin user. System must have at least one admin.';
    END IF;
  END IF;
  
  -- Log admin role changes
  PERFORM public.log_security_audit(
    'ADMIN_ROLE_DELETED',
    'USER_ROLES',
    OLD.user_id,
    jsonb_build_object('deleted_by', auth.uid(), 'role', OLD.role)
  );
  
  RETURN OLD;
END;
$$;

-- Create trigger to prevent zero admins
DROP TRIGGER IF EXISTS prevent_zero_admins_trigger ON public.user_roles;
CREATE TRIGGER prevent_zero_admins_trigger
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_zero_admins();

-- 4. Enhanced security for profiles - restrict access to sensitive fields
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all profiles for moderation
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add rate limiting table for API calls
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address inet NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system functions should access rate limits
CREATE POLICY "System only access to rate limits" 
ON public.rate_limits 
FOR ALL 
TO authenticated
USING (false);

-- 6. Enhanced file upload validation function
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  _file_name text,
  _file_size bigint,
  _mime_type text,
  _bucket_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  allowed_types text[] := ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  max_file_size bigint := 10485760; -- 10MB
BEGIN
  -- Check file size
  IF _file_size > max_file_size THEN
    RAISE EXCEPTION 'File size exceeds maximum allowed size of 10MB';
  END IF;
  
  -- Check MIME type
  IF _mime_type != ANY(allowed_types) THEN
    RAISE EXCEPTION 'File type not allowed. Allowed types: %', array_to_string(allowed_types, ', ');
  END IF;
  
  -- Check file extension matches MIME type
  IF (_mime_type = 'image/jpeg' AND NOT (_file_name ILIKE '%.jpg' OR _file_name ILIKE '%.jpeg')) OR
     (_mime_type = 'image/png' AND NOT _file_name ILIKE '%.png') OR
     (_mime_type = 'image/gif' AND NOT _file_name ILIKE '%.gif') OR
     (_mime_type = 'image/webp' AND NOT _file_name ILIKE '%.webp') OR
     (_mime_type = 'application/pdf' AND NOT _file_name ILIKE '%.pdf') THEN
    RAISE EXCEPTION 'File extension does not match MIME type';
  END IF;
  
  -- Log file upload validation
  PERFORM public.log_security_audit(
    'FILE_UPLOAD_VALIDATED',
    'STORAGE',
    NULL,
    jsonb_build_object(
      'file_name', _file_name,
      'file_size', _file_size,
      'mime_type', _mime_type,
      'bucket', _bucket_name
    )
  );
  
  RETURN TRUE;
END;
$$;

-- 7. Create function to get security metrics (for admin dashboard)
CREATE OR REPLACE FUNCTION public.get_security_metrics()
RETURNS TABLE(
  metric text,
  value bigint,
  period text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow admins to access security metrics
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    'Recent Failed Logins'::text,
    COUNT(*)::bigint,
    'Last 24 hours'::text
  FROM public.security_logs 
  WHERE event_type = 'FAILED_LOGIN' 
    AND created_at > now() - interval '24 hours'

  UNION ALL

  SELECT 
    'Active Admin Users'::text,
    COUNT(*)::bigint,
    'Current'::text
  FROM public.user_roles 
  WHERE role = 'admin'

  UNION ALL

  SELECT 
    'Recent Incident Reports'::text,
    COUNT(*)::bigint,
    'Last 7 days'::text
  FROM public.incident_reports 
  WHERE created_at > now() - interval '7 days'

  UNION ALL

  SELECT 
    'Security Events Today'::text,
    COUNT(*)::bigint,
    'Today'::text
  FROM public.security_logs 
  WHERE DATE(created_at) = CURRENT_DATE;
END;
$$;