-- CRITICAL SECURITY FIXES - Part 1: Database Functions
-- This migration addresses multiple security vulnerabilities identified by the linter

-- 1. Fix all database functions to use secure search_path
-- This prevents search path attacks by ensuring functions use a fixed, secure search path

CREATE OR REPLACE FUNCTION public.validate_university_email(email_address text)
 RETURNS TABLE(is_student_email boolean, university_name text, university_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.calculate_verification_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_incident_reports_with_reporter()
 RETURNS TABLE(id uuid, reporter_id uuid, incident_type text, transit_line text, location_name text, description text, latitude numeric, longitude numeric, accuracy numeric, image_url text, created_at timestamp with time zone, updated_at timestamp with time zone, status text, reporter_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.get_available_spots(ride_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  max_spots_val INTEGER;
  current_members_val INTEGER;
BEGIN
  SELECT gr.max_spots INTO max_spots_val
  FROM public.group_rides gr
  WHERE gr.id = ride_id_param;
  
  SELECT COUNT(*) INTO current_members_val
  FROM public.group_ride_members grm
  WHERE grm.ride_id = ride_id_param AND grm.status = 'joined';
  
  RETURN COALESCE(max_spots_val, 0) - COALESCE(current_members_val, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_ride_status_if_full()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Update ride status to 'full' if no spots available
  UPDATE public.group_rides 
  SET status = 'full', updated_at = now()
  WHERE id = COALESCE(NEW.ride_id, OLD.ride_id)
    AND status = 'active'
    AND public.get_available_spots(COALESCE(NEW.ride_id, OLD.ride_id)) <= 0;
    
  -- Update ride status back to 'active' if spots become available
  UPDATE public.group_rides 
  SET status = 'active', updated_at = now()
  WHERE id = COALESCE(NEW.ride_id, OLD.ride_id)
    AND status = 'full'
    AND public.get_available_spots(COALESCE(NEW.ride_id, OLD.ride_id)) > 0;
    
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_event(_event_type text, _event_data jsonb DEFAULT '{}'::jsonb, _user_agent text DEFAULT NULL::text, _ip_address inet DEFAULT NULL::inet)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.analytics_events (
    user_id,
    event_type,
    event_data,
    user_agent,
    ip_address
  ) VALUES (
    auth.uid(),
    _event_type,
    _event_data,
    _user_agent,
    _ip_address
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_verify_student_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.create_next_recurring_ride(ride_id_param uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  original_ride RECORD;
  new_ride_id UUID;
  next_departure TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the original ride details
  SELECT * INTO original_ride
  FROM public.group_rides
  WHERE id = ride_id_param AND is_recurring = true;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Calculate next departure time based on recurrence pattern
  CASE original_ride.recurrence_pattern
    WHEN 'daily' THEN
      next_departure := original_ride.departure_time + INTERVAL '1 day';
    WHEN 'weekly' THEN
      next_departure := original_ride.departure_time + INTERVAL '1 week';
    WHEN 'monthly' THEN
      next_departure := original_ride.departure_time + INTERVAL '1 month';
    ELSE
      RETURN NULL;
  END CASE;
  
  -- Only create if the next occurrence is in the future
  IF next_departure > NOW() THEN
    -- Create new recurring ride
    INSERT INTO public.group_rides (
      creator_id,
      cta_line,
      station_name,
      university_name,
      departure_time,
      max_spots,
      description,
      is_recurring,
      recurrence_pattern,
      next_occurrence
    ) VALUES (
      original_ride.creator_id,
      original_ride.cta_line,
      original_ride.station_name,
      original_ride.university_name,
      next_departure,
      original_ride.max_spots,
      original_ride.description,
      true,
      original_ride.recurrence_pattern,
      CASE original_ride.recurrence_pattern
        WHEN 'daily' THEN next_departure + INTERVAL '1 day'
        WHEN 'weekly' THEN next_departure + INTERVAL '1 week'
        WHEN 'monthly' THEN next_departure + INTERVAL '1 month'
      END
    ) RETURNING id INTO new_ride_id;
    
    -- Update the original ride's next occurrence
    UPDATE public.group_rides 
    SET next_occurrence = CASE recurrence_pattern
      WHEN 'daily' THEN next_departure + INTERVAL '1 day'
      WHEN 'weekly' THEN next_departure + INTERVAL '1 week'
      WHEN 'monthly' THEN next_departure + INTERVAL '1 month'
    END
    WHERE id = ride_id_param;
    
    RETURN new_ride_id;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_incident_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  notification_payload jsonb;
  net_extension_exists boolean := false;
BEGIN
  -- Check if pg_net extension exists
  SELECT EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net'
  ) INTO net_extension_exists;
  
  -- If pg_net doesn't exist, just log and continue
  IF NOT net_extension_exists THEN
    RAISE NOTICE 'pg_net extension not available, skipping notification for incident %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Build notification payload
  notification_payload := jsonb_build_object(
    'title', '🚨 Safety Alert',
    'body', format('%s reported on %s at %s', 
      CASE 
        WHEN NEW.incident_type = 'emergency' THEN 'EMERGENCY'
        ELSE initcap(NEW.incident_type)
      END,
      CASE 
        WHEN NEW.transit_line = 'chicago' THEN 'CTA'
        WHEN NEW.transit_line = 'nyc' THEN 'MTA'
        WHEN NEW.transit_line = 'washington_dc' THEN 'Metro'
        WHEN NEW.transit_line = 'atlanta' THEN 'MARTA'
        WHEN NEW.transit_line = 'philadelphia' THEN 'SEPTA'
        WHEN NEW.transit_line = 'denver' THEN 'RTD'
        ELSE NEW.transit_line
      END,
      NEW.location_name
    ),
    'cityFilter', NEW.transit_line,
    'priority', CASE 
      WHEN NEW.incident_type = 'emergency' THEN 'high'
      ELSE 'normal'
    END,
    'data', jsonb_build_object(
      'incident_id', NEW.id,
      'incident_type', NEW.incident_type,
      'location', NEW.location_name,
      'city', NEW.transit_line,
      'timestamp', NEW.created_at
    )
  );

  -- Try to call the edge function using pg_net (will only work if extension is available)
  BEGIN
    PERFORM net.http_post(
      url := 'https://jhvdfihloyjdfrvbegqh.supabase.co/functions/v1/send-targeted-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
      ),
      body := notification_payload
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the transaction
      RAISE NOTICE 'Failed to send notification for incident %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_user_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  net_extension_exists boolean := false;
BEGIN
  -- Check if pg_net extension exists
  SELECT EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net'
  ) INTO net_extension_exists;
  
  -- If pg_net doesn't exist, just log and continue
  IF NOT net_extension_exists THEN
    RAISE NOTICE 'pg_net extension not available, skipping signup notification for user %', NEW.id;
    RETURN NEW;
  END IF;

  -- Send webhook to our edge function for new user signups
  BEGIN
    PERFORM net.http_post(
      url := 'https://jhvdfihloyjdfrvbegqh.supabase.co/functions/v1/notify-new-signup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'users',
        'schema', 'auth',
        'record', row_to_json(NEW),
        'old_record', null
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the signup process
      RAISE NOTICE 'Failed to send signup notification for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event(_event_type text, _event_data jsonb DEFAULT NULL::jsonb, _ip_address inet DEFAULT NULL::inet, _user_agent text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_security_audit(_action_type text, _resource_type text, _resource_id uuid DEFAULT NULL::uuid, _additional_data jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
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
  INSERT INTO public.security_audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    additional_data
  ) VALUES (
    auth.uid(),
    'DATA_CLEANUP',
    'SYSTEM',
    NULL,
    jsonb_build_object('cleanup_date', now())
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.export_user_data(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
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
  INSERT INTO public.security_audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    additional_data
  ) VALUES (
    auth.uid(),
    'DATA_EXPORT',
    'USER_DATA',
    _user_id,
    jsonb_build_object('exported_by', auth.uid())
  );
  
  RETURN user_data;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_user_data(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Only allow users to delete their own data or admins
  IF auth.uid() != _user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot delete data for other users';
  END IF;
  
  -- Log the deletion request first
  INSERT INTO public.security_audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    additional_data
  ) VALUES (
    auth.uid(),
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
  INSERT INTO public.security_audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    additional_data
  ) VALUES (
    auth.uid(),
    'DATA_DELETION_COMPLETED',
    'USER_DATA',
    _user_id,
    jsonb_build_object('deleted_by', auth.uid())
  );
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
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
    INSERT INTO public.security_audit_logs (
      user_id,
      action_type,
      resource_type,
      resource_id,
      additional_data
    ) VALUES (
      auth.uid(),
      'ADMIN_BOOTSTRAP',
      'USER_ROLES',
      _user_id,
      jsonb_build_object('first_admin_created', now())
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_zero_admins()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
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
  INSERT INTO public.security_audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    additional_data
  ) VALUES (
    auth.uid(),
    'ADMIN_ROLE_DELETED',
    'USER_ROLES',
    OLD.user_id,
    jsonb_build_object('deleted_by', auth.uid(), 'role', OLD.role)
  );
  
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_file_upload(_file_name text, _file_size bigint, _mime_type text, _bucket_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
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
  INSERT INTO public.security_audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    additional_data
  ) VALUES (
    auth.uid(),
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
$function$;

CREATE OR REPLACE FUNCTION public.get_security_metrics()
 RETURNS TABLE(metric text, value bigint, period text)
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;