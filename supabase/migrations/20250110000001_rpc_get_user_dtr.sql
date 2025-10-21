-- RPC Function: get_user_dtr
-- Purpose: Retrieve monthly DTR data for a specific user in CSC Form No. 48 format
-- Parameters:
--   p_user_id: User ID to fetch DTR for
--   p_month: Month in 'YYYY-MM' format
-- Returns: Daily attendance records with AM/PM sessions and undertime

drop function if exists public.get_user_dtr(text, text);

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
  pm_undertime INTERVAL,
  regular_days_schedule TEXT,
  saturdays_schedule TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_schedule AS (
    -- Get user's schedule and slot information
    SELECT
      u.schedule_id,
      sl.day_of_week,
      sl.start_time,
      sl.end_time,
      ROW_NUMBER() OVER (
        PARTITION BY sl.day_of_week
        ORDER BY sl.start_time
      ) AS slot_order
    FROM "user" u
    JOIN schedule sch ON u.schedule_id = sch.schedule_id
    JOIN slot sl ON sch.schedule_id = sl.schedule_id
    WHERE u.user_id = p_user_id
  ),
  regular_days_schedule AS (
    -- Get Regular Days schedule (Monday only)
    SELECT
      TO_CHAR(slot1.start_time, 'HH12:MI AM') || ' - ' || 
      TO_CHAR(slot2.end_time, 'HH12:MI AM') AS schedule_text
    FROM user_schedule slot1
    JOIN user_schedule slot2 ON slot1.day_of_week = slot2.day_of_week
    WHERE slot1.day_of_week = 1  -- Monday only
      AND slot1.slot_order = 1  -- First slot (AM)
      AND slot2.slot_order = 2  -- Second slot (PM)
  ),
  saturdays_schedule AS (
    -- Get Saturdays schedule
    SELECT
      TO_CHAR(slot1.start_time, 'HH12:MI AM') || ' - ' || 
      TO_CHAR(slot2.end_time, 'HH12:MI AM') AS schedule_text
    FROM user_schedule slot1
    JOIN user_schedule slot2 ON slot1.day_of_week = slot2.day_of_week
    WHERE slot1.day_of_week = 6  -- Saturday
      AND slot1.slot_order = 1  -- First slot (AM)
      AND slot2.slot_order = 2  -- Second slot (PM)
  ),
  month_sessions AS (
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
  -- Combine AM and PM sessions with schedule information
  SELECT
    COALESCE(am.day_num, pm.day_num) AS day_number,
    am.am_arrival,
    am.am_departure,
    pm.pm_arrival,
    pm.pm_departure,
    am.am_undertime,
    pm.pm_undertime,
    COALESCE(rds.schedule_text, '') AS regular_days_schedule,
    COALESCE(ss.schedule_text, '') AS saturdays_schedule
  FROM am_sessions am
  FULL OUTER JOIN pm_sessions pm ON am.day_num = pm.day_num
  CROSS JOIN regular_days_schedule rds
  CROSS JOIN saturdays_schedule ss
  ORDER BY day_number;
END;
$$ LANGUAGE plpgsql STABLE;

