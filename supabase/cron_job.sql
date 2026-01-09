-- Enable the pg_cron extension if not enabled
create extension if not exists pg_cron;

-- Schedule a daily job to archive properties older than 30 days
-- '0 0 * * *' runs every day at midnight
-- We update status to 'inactive' (soft archive) instead of deleting
SELECT cron.schedule(
  'archive-old-properties', -- job name
  '0 0 * * *',              -- schedule (daily at midnight)
  $$
    UPDATE properties 
    SET status = 'inactive', 
        available_for_sale = false 
    WHERE status = 'approved' 
      AND created_at < now() - interval '30 days';
  $$
);

-- To view scheduled jobs:
-- select * from cron.job;

-- To unschedule:
-- select cron.unschedule('archive-old-properties');
