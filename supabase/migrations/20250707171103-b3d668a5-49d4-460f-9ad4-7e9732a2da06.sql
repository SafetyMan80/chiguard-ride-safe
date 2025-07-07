-- Enable required extensions for cron jobs and enhanced security
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create enhanced security audit table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  additional_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on security audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view security audit logs
CREATE POLICY "Admins can view security audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_audit(
  _action_type TEXT,
  _resource_type TEXT,
  _resource_id UUID DEFAULT NULL,
  _additional_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    additional_data
  ) VALUES (
    auth.uid(),
    _action_type,
    _resource_type,
    _resource_id,
    _additional_data
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create data retention function
CREATE OR REPLACE FUNCTION public.cleanup_old_data() 
RETURNS void AS $$
BEGIN
  -- Delete old security logs (keep 1 year)
  DELETE FROM public.security_logs 
  WHERE created_at < now() - INTERVAL '1 year';
  
  -- Delete old analytics events (keep 6 months)
  DELETE FROM public.analytics_events 
  WHERE created_at < now() - INTERVAL '6 months';
  
  -- Delete old audit logs (keep 2 years)
  DELETE FROM public.security_audit_logs 
  WHERE created_at < now() - INTERVAL '2 years';
  
  -- Archive old incident reports (mark as archived after 1 year)
  UPDATE public.incident_reports 
  SET status = 'archived' 
  WHERE created_at < now() - INTERVAL '1 year' 
  AND status = 'active';
  
  -- Delete very old archived incidents (after 3 years)
  DELETE FROM public.incident_reports 
  WHERE created_at < now() - INTERVAL '3 years' 
  AND status = 'archived';
  
  -- Log the cleanup operation
  PERFORM public.log_security_audit(
    'DATA_CLEANUP',
    'SYSTEM',
    NULL,
    jsonb_build_object('cleanup_date', now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user data export function
CREATE OR REPLACE FUNCTION public.export_user_data(_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_data JSONB;
BEGIN
  -- Only allow users to export their own data or admins to export any data
  IF auth.uid() != _user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot export data for other users';
  END IF;
  
  SELECT jsonb_build_object(
    'profile', (
      SELECT to_jsonb(p.*) 
      FROM public.profiles p 
      WHERE p.user_id = _user_id
    ),
    'group_rides_created', (
      SELECT jsonb_agg(to_jsonb(gr.*))
      FROM public.group_rides gr 
      WHERE gr.creator_id = _user_id
    ),
    'general_rides_created', (
      SELECT jsonb_agg(to_jsonb(ggr.*))
      FROM public.general_group_rides ggr 
      WHERE ggr.creator_id = _user_id
    ),
    'ride_memberships', (
      SELECT jsonb_agg(to_jsonb(grm.*))
      FROM public.group_ride_members grm 
      WHERE grm.user_id = _user_id
    ),
    'general_ride_memberships', (
      SELECT jsonb_agg(to_jsonb(grm.*))
      FROM public.general_ride_members grm 
      WHERE grm.user_id = _user_id
    ),
    'incident_reports', (
      SELECT jsonb_agg(to_jsonb(ir.*))
      FROM public.incident_reports ir 
      WHERE ir.reporter_id = _user_id
    ),
    'messages_sent', (
      SELECT jsonb_agg(to_jsonb(gm.*))
      FROM public.group_messages gm 
      WHERE gm.sender_id = _user_id
    ),
    'export_date', now()
  ) INTO user_data;
  
  -- Log the data export
  PERFORM public.log_security_audit(
    'DATA_EXPORT',
    'USER_DATA',
    _user_id,
    jsonb_build_object('exported_by', auth.uid())
  );
  
  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure user data deletion function
CREATE OR REPLACE FUNCTION public.delete_user_data(_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow users to delete their own data or admins
  IF auth.uid() != _user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot delete data for other users';
  END IF;
  
  -- Log the deletion request first
  PERFORM public.log_security_audit(
    'DATA_DELETION_REQUEST',
    'USER_DATA',
    _user_id,
    jsonb_build_object('requested_by', auth.uid())
  );
  
  -- Delete user data in correct order (respecting foreign keys)
  DELETE FROM public.group_messages WHERE sender_id = _user_id;
  DELETE FROM public.group_ride_members WHERE user_id = _user_id;
  DELETE FROM public.general_ride_members WHERE user_id = _user_id;
  DELETE FROM public.incident_reports WHERE reporter_id = _user_id;
  
  -- Archive rides instead of deleting (preserve ride history for other members)
  UPDATE public.group_rides SET status = 'deleted' WHERE creator_id = _user_id;
  UPDATE public.general_group_rides SET status = 'deleted' WHERE creator_id = _user_id;
  
  -- Delete profile and verification data
  DELETE FROM public.id_verifications WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE user_id = _user_id;
  
  -- Delete analytics and logs
  DELETE FROM public.analytics_events WHERE user_id = _user_id;
  DELETE FROM public.security_logs WHERE user_id = _user_id;
  
  -- Log successful deletion
  PERFORM public.log_security_audit(
    'DATA_DELETION_COMPLETED',
    'USER_DATA',
    _user_id,
    jsonb_build_object('deleted_by', auth.uid())
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;