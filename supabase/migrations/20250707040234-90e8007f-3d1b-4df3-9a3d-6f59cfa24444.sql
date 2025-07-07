-- Fix the incident notification function to handle missing pg_net extension
CREATE OR REPLACE FUNCTION public.send_incident_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;