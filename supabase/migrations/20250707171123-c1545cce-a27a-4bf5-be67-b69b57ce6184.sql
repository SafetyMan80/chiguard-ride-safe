-- Schedule automated data cleanup to run weekly on Sundays at 2 AM
SELECT cron.schedule(
  'weekly-data-cleanup',
  '0 2 * * 0', -- Every Sunday at 2 AM
  $$
  SELECT public.cleanup_old_data();
  $$
);