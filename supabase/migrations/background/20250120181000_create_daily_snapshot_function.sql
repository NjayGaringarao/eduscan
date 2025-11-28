-- RPC function to manually trigger daily performance snapshot computation
-- This is a convenience wrapper that calls trigger_daily_snapshot_computation()
-- The actual computation is done via the Edge Function which calls the FaceID ML server
-- Note: For scheduled automatic computation, see the cron job in schedule_daily_snapshot_job.sql

DROP FUNCTION IF EXISTS public.compute_daily_performance_snapshot(date);

CREATE OR REPLACE FUNCTION public.compute_daily_performance_snapshot(
  target_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- If no target_date provided, use yesterday (default behavior)
  -- The trigger function always uses yesterday, so we just call it
  -- Note: This function provides a manual trigger interface, but target_date parameter
  -- is not currently used as the trigger function always computes for yesterday
  
  -- Call the trigger function which handles the Edge Function invocation
  PERFORM public.trigger_daily_snapshot_computation();
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Daily snapshot computation triggered via Edge Function',
    'note', 'The computation is asynchronous. Check daily_performance_snapshot table for results.',
    'target_date', COALESCE(target_date, (CURRENT_DATE - INTERVAL '1 day')::date)
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.compute_daily_performance_snapshot(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_daily_performance_snapshot(date) TO service_role;

