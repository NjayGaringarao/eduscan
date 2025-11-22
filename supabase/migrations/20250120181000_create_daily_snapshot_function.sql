-- RPC function to compute daily performance snapshot
-- This function calls the Supabase Edge Function which orchestrates the computation
-- The Edge Function computes metrics for the specified target_date but stores with current timestamp (created_at)

drop function if exists public.compute_daily_performance_snapshot(date);

CREATE OR REPLACE FUNCTION public.compute_daily_performance_snapshot(
  target_date date DEFAULT (CURRENT_DATE - INTERVAL '1 day')::date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- This function is a placeholder that returns instructions
  -- The actual computation is done via the Edge Function due to HTTP calls needed
  -- For direct database-only computation, we would need pg_net extension
  -- For now, the cron job will call the Edge Function via HTTP
  
  RETURN jsonb_build_object(
    'message', 'Use the Supabase Edge Function compute_daily_snapshot for snapshot computation',
    'target_date', target_date,
    'note', 'Metrics are stored with current timestamp (created_at), not target_date'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.compute_daily_performance_snapshot(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_daily_performance_snapshot(date) TO service_role;

