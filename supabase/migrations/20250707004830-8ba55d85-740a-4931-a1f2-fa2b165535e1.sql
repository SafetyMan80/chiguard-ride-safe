-- Add indexes for frequently queried tables to improve performance

-- Group rides indexes
CREATE INDEX IF NOT EXISTS idx_group_rides_status_departure ON public.group_rides(status, departure_time);
CREATE INDEX IF NOT EXISTS idx_group_rides_creator ON public.group_rides(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_rides_university ON public.group_rides(university_name);
CREATE INDEX IF NOT EXISTS idx_group_rides_cta_line ON public.group_rides(cta_line);

-- General group rides indexes  
CREATE INDEX IF NOT EXISTS idx_general_group_rides_status_departure ON public.general_group_rides(status, departure_time);
CREATE INDEX IF NOT EXISTS idx_general_group_rides_locations ON public.general_group_rides(departure_location, destination_location);
CREATE INDEX IF NOT EXISTS idx_general_group_rides_creator ON public.general_group_rides(creator_id);

-- Incident reports indexes
CREATE INDEX IF NOT EXISTS idx_incident_reports_status_created ON public.incident_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_reports_transit_line ON public.incident_reports(transit_line);
CREATE INDEX IF NOT EXISTS idx_incident_reports_location ON public.incident_reports(location_name);
CREATE INDEX IF NOT EXISTS idx_incident_reports_reporter ON public.incident_reports(reporter_id);

-- Group ride members indexes
CREATE INDEX IF NOT EXISTS idx_group_ride_members_ride_status ON public.group_ride_members(ride_id, status);
CREATE INDEX IF NOT EXISTS idx_group_ride_members_user ON public.group_ride_members(user_id);

-- General ride members indexes
CREATE INDEX IF NOT EXISTS idx_general_ride_members_ride_status ON public.general_ride_members(ride_id, status);
CREATE INDEX IF NOT EXISTS idx_general_ride_members_user ON public.general_ride_members(user_id);

-- Group messages indexes
CREATE INDEX IF NOT EXISTS idx_group_messages_ride_created ON public.group_messages(ride_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender ON public.group_messages(sender_id);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_university ON public.profiles(university_name);

-- ID verifications indexes
CREATE INDEX IF NOT EXISTS idx_id_verifications_user_status ON public.id_verifications(user_id, verification_status);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_group_rides_active_university_departure ON public.group_rides(status, university_name, departure_time) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_general_group_rides_active_departure ON public.general_group_rides(status, departure_time) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_incident_reports_active_recent ON public.incident_reports(status, created_at DESC) WHERE status = 'active';