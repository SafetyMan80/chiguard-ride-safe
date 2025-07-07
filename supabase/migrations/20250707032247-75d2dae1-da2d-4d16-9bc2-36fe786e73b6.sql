-- Add push notification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS notification_city TEXT;

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_profiles_notification_city ON public.profiles(notification_city);
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON public.profiles(push_token);