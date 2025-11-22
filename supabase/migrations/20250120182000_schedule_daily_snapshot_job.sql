-- Schedule daily snapshot computation job
-- This uses pg_net to call the Supabase Edge Function
-- Note: pg_net extension must be enabled for this to work

-- Create a function to call the Edge Function via HTTP
drop function if exists public.trigger_daily_snapshot_computation();

CREATE OR REPLACE FUNCTION public.trigger_daily_snapshot_computation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  supabase_anon_key text;
  target_date date;
  response jsonb;
BEGIN
  -- Get configuration from environment or config table
  SELECT value INTO supabase_url FROM public.config WHERE key = 'SUPABASE_URL';
  SELECT value INTO supabase_anon_key FROM public.config WHERE key = 'SUPABASE_ANON_KEY';
  
  -- If not in config, try to get from settings (this may need adjustment based on your setup)
  IF supabase_url IS NULL THEN
    -- Use a default or fetch from Supabase settings
    -- For now, we'll use a placeholder that needs to be configured
    RAISE NOTICE 'SUPABASE_URL not found in config. Please set it in the config table.';
    RETURN;
  END IF;
  
  -- Calculate target date (yesterday)
  -- The Edge Function will compute metrics for this date but store with current timestamp (created_at)
  target_date := (CURRENT_DATE - INTERVAL '1 day')::date;
  
  -- Call the Edge Function via HTTP using pg_net
  SELECT * INTO response FROM net.http_post(
    url := supabase_url || '/functions/v1/compute_daily_snapshot',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || supabase_anon_key
    ),
    body := jsonb_build_object(
      'target_date', target_date::text
    )
  );
  
  RAISE NOTICE 'Daily snapshot computation triggered for target date: %', target_date;
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

-- Alternative: If pg_net is not available, use a simpler approach
-- The cron job can be set up to directly call the Edge Function URL via external tool
-- Or we can use a Supabase webhook/cron feature if available

COMMENT ON FUNCTION public.trigger_daily_snapshot_computation() IS 
'Triggers daily performance snapshot computation by calling the Supabase Edge Function';

