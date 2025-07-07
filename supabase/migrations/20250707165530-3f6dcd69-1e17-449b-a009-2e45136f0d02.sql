-- Add profile visibility option to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_public_profile boolean NOT NULL DEFAULT true;

-- Add index for performance
CREATE INDEX idx_profiles_public ON public.profiles(is_public_profile);