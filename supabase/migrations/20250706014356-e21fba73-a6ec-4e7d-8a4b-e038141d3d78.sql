-- Enhanced Row Level Security Policies - Fixed Order

-- Update group_ride_members policies to be more restrictive
DROP POLICY IF EXISTS "Anyone can view group ride members" ON public.group_ride_members;
CREATE POLICY "Authenticated users can view group ride members" 
ON public.group_ride_members 
FOR SELECT 
TO authenticated
USING (true);

-- Create user_roles table and enum first
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Now create policies that reference the function
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policies for incident reports management
CREATE POLICY "Admins can manage all incident reports" 
ON public.incident_reports 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger for user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security logs" 
ON public.security_logs 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type TEXT,
  _event_data JSONB DEFAULT NULL,
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    event_type,
    event_data,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    _event_type,
    _event_data,
    _ip_address,
    _user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;