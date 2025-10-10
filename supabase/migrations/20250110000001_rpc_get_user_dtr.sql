-- RPC Function: get_user_dtr
-- Purpose: Retrieve monthly DTR data for a specific user in CSC Form No. 48 format
-- Parameters:
--   p_user_id: User ID to fetch DTR for
--   p_month: Month in 'YYYY-MM' format
-- Returns: Daily attendance records with AM/PM sessions and undertime

CREATE OR REPLACE FUNCTION get_user_dtr(
  p_user_id TEXT,
  p_month TEXT
)
RETURNS TABLE(
  day_number INTEGER,
  am_arrival TIMESTAMPTZ,
  am_departure TIMESTAMPTZ,
  pm_arrival TIMESTAMPTZ,
  pm_departure TIMESTAMPTZ,
  am_undertime INTERVAL,
  pm_undertime INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  WITH month_sessions AS (
    -- Get all completed, scheduled sessions for the month
    SELECT
      s.session_id,
      s.arrival,
      s.departure,
      s.undertime,
      EXTRACT(DAY FROM s.arrival AT TIME ZONE 'Asia/Manila')::INTEGER AS day_num,
      ROW_NUMBER() OVER (
        PARTITION BY DATE(s.arrival AT TIME ZONE 'Asia/Manila')
        ORDER BY s.arrival
      ) AS session_order
    FROM session s
    WHERE s.user_id = p_user_id
      AND s.slot_id IS NOT NULL  -- Only scheduled sessions
      AND s.is_active = false     -- Only completed sessions
      AND s.arrival >= (p_month || '-01')::DATE
      AND s.arrival < (p_month || '-01')::DATE + INTERVAL '1 month'
  ),
  am_sessions AS (
    -- First session of the day = AM
    SELECT
      day_num,
      arrival AS am_arrival,
      departure AS am_departure,
      undertime AS am_undertime
    FROM month_sessions
    WHERE session_order = 1
  ),
  pm_sessions AS (
    -- Second session of the day = PM
    SELECT
      day_num,
      arrival AS pm_arrival,
      departure AS pm_departure,
      undertime AS pm_undertime
    FROM month_sessions
    WHERE session_order = 2
  )
  -- Combine AM and PM sessions
  SELECT
    COALESCE(am.day_num, pm.day_num) AS day_number,
    am.am_arrival,
    am.am_departure,
    pm.pm_arrival,
    pm.pm_departure,
    am.am_undertime,
    pm.pm_undertime
  FROM am_sessions am
  FULL OUTER JOIN pm_sessions pm ON am.day_num = pm.day_num
  ORDER BY day_number;
END;
$$ LANGUAGE plpgsql STABLE;

