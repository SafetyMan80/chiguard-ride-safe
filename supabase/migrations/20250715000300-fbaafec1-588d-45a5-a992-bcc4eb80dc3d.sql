-- Create a trigger function to notify about new user signups
CREATE OR REPLACE FUNCTION public.notify_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create trigger on auth.users table for new signups
DROP TRIGGER IF EXISTS on_auth_user_signup_notify ON auth.users;
CREATE TRIGGER on_auth_user_signup_notify
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user_signup();