-- Schedule daily snapshot computation job
-- This uses pg_net to call the Supabase Edge Function
-- Note: pg_net extension must be enabled for this to work (see 20250120180000_enable_extensions.sql)
-- Note: Project reference can be set via: SET app.project_ref = 'your-project-ref'

-- Create a function to call the Edge Function via HTTP
DROP FUNCTION IF EXISTS public.trigger_daily_snapshot_computation();

CREATE OR REPLACE FUNCTION public.trigger_daily_snapshot_computation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_ref text;
  supabase_url text;
  target_date date;
  response jsonb;
  response_status int;
  error_message text;
BEGIN
  -- Get project reference from connection setting
  -- Can be set via: SET app.project_ref = 'your-project-ref'
  -- Or via database connection parameters
  project_ref := current_setting('app.project_ref', true);
  
  -- Validate project reference exists
  IF project_ref IS NULL OR project_ref = '' THEN
    RAISE EXCEPTION 'Project reference not found. Please set it via: SET app.project_ref = ''your-project-ref''';
  END IF;
  
  -- Construct Supabase URL from project reference
  supabase_url := 'https://' || project_ref || '.supabase.co/functions/v1/compute_daily_snapshot';
  
  -- Calculate target date (yesterday)
  -- The Edge Function will compute metrics for this date but store with current timestamp (created_at)
  target_date := (CURRENT_DATE - INTERVAL '1 day')::date;
  
  -- Call the Edge Function via HTTP using pg_net
  -- Note: Edge Function doesn't validate Authorization header - it only checks POST method
  -- All credentials are accessed via environment variables within the Edge Function
  SELECT status_code, content::jsonb INTO response_status, response
  FROM net.http_post(
    url := supabase_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'target_date', target_date::text
    )
  );
  
  -- Check response status
  IF response_status != 200 THEN
    error_message := COALESCE(response->>'error', 'Unknown error');
    RAISE WARNING 'Daily snapshot computation failed for target date %: HTTP % - %', 
      target_date, response_status, error_message;
    -- Log to system_log if table exists
    BEGIN
      INSERT INTO system_log (type, title, description)
      VALUES (
        'ERROR',
        'Daily Snapshot Computation Failed',
        'Target date: ' || target_date || ', HTTP Status: ' || response_status || ', Error: ' || error_message
      );
    EXCEPTION WHEN OTHERS THEN
      -- system_log table might not exist, ignore
      NULL;
    END;
  ELSE
    RAISE NOTICE 'Daily snapshot computation triggered successfully for target date: %', target_date;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.trigger_daily_snapshot_computation() TO service_role;

-- Schedule the job to run daily at 11:59 PM
-- Note: Cron schedule format: minute hour day month weekday
-- '59 23 * * *' means run at 23:59 (11:59 PM) every day
SELECT cron.schedule(
  'daily-performance-snapshot',
  '59 23 * * *',  -- Run at 11:59 PM every day
  $$
  SELECT public.trigger_daily_snapshot_computation();
  $$
);

COMMENT ON FUNCTION public.trigger_daily_snapshot_computation() IS 
'Triggers daily performance snapshot computation by calling the Supabase Edge Function. Requires app.project_ref to be set via connection setting (SET app.project_ref = ''your-project-ref''). The Edge Function has all credentials via environment variables and does not require authentication headers.';

