-- Create function to send targeted notifications when incidents are reported
CREATE OR REPLACE FUNCTION public.send_incident_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_payload jsonb;
BEGIN
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

  -- Call the edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := 'https://jhvdfihloyjdfrvbegqh.supabase.co/functions/v1/send-targeted-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    ),
    body := notification_payload
  );

  RETURN NEW;
END;
$$;

-- Create trigger that fires after incident insertion
DROP TRIGGER IF EXISTS trigger_send_incident_notification ON public.incident_reports;
CREATE TRIGGER trigger_send_incident_notification
  AFTER INSERT ON public.incident_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.send_incident_notification();