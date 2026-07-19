
-- Returns: Daily attendance records with AM/PM sessions and undertime

DROP FUNCTION IF EXISTS public.get_user_dtr(text, text);

CREATE OR REPLACE FUNCTION public.get_user_dtr(
  p_user_id TEXT,
  p_month TEXT
)
RETURNS TABLE(
  day_number INTEGER,
  am_arrival TIMESTAMPTZ,
  am_departure TIMESTAMPTZ,
  pm_arrival TIMESTAMPTZ,
  pm_departure TIMESTAMPTZ,
  am_undertime INTEGER,
  pm_undertime INTEGER,
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
    JOIN schedule sch ON u.schedule_id = sch.id
    JOIN slot sl ON sch.id = sl.schedule_id
    WHERE u.id = p_user_id
  ),
  regular_days_schedule AS (
    -- Get Regular Days schedule (Monday only)
    -- Handle cases: both AM and PM, only AM, or only PM
    SELECT
      CASE 
        -- Both AM and PM exist
        WHEN slot1.slot_order = 1 AND slot2.slot_order = 2 THEN
          TO_CHAR(slot1.start_time, 'HH12:MI AM') || ' - ' || 
          TO_CHAR(slot2.end_time, 'HH12:MI AM')
        -- Only AM exists
        WHEN slot1.slot_order = 1 AND slot2.slot_order IS NULL THEN
          TO_CHAR(slot1.start_time, 'HH12:MI AM') || ' - ' || 
          TO_CHAR(slot1.end_time, 'HH12:MI AM')
        -- Only PM exists (fallback case)
        ELSE ''
      END AS schedule_text
    FROM user_schedule slot1
    LEFT JOIN user_schedule slot2 ON slot1.day_of_week = slot2.day_of_week
      AND slot2.slot_order = 2
    WHERE slot1.day_of_week = 1  -- Monday only
      AND slot1.slot_order = 1  -- First slot (AM)
    UNION
    -- Handle case where only PM exists (no AM slot)
    SELECT
      TO_CHAR(slot2.start_time, 'HH12:MI AM') || ' - ' || 
      TO_CHAR(slot2.end_time, 'HH12:MI AM') AS schedule_text
    FROM user_schedule slot2
    WHERE slot2.day_of_week = 1
      AND slot2.slot_order = 2
      AND NOT EXISTS (
        SELECT 1 FROM user_schedule s1 
        WHERE s1.day_of_week = 1 AND s1.slot_order = 1
      )
    LIMIT 1
  ),
  saturdays_schedule AS (
    -- Get Saturdays schedule
    -- Handle cases: both AM and PM, only AM, or only PM
    SELECT
      CASE 
        -- Both AM and PM exist
        WHEN slot1.slot_order = 1 AND slot2.slot_order = 2 THEN
          TO_CHAR(slot1.start_time, 'HH12:MI AM') || ' - ' || 
          TO_CHAR(slot2.end_time, 'HH12:MI AM')
        -- Only AM exists
        WHEN slot1.slot_order = 1 AND slot2.slot_order IS NULL THEN
          TO_CHAR(slot1.start_time, 'HH12:MI AM') || ' - ' || 
          TO_CHAR(slot1.end_time, 'HH12:MI AM')
        -- Only PM exists (fallback case)
        ELSE ''
      END AS schedule_text
    FROM user_schedule slot1
    LEFT JOIN user_schedule slot2 ON slot1.day_of_week = slot2.day_of_week
      AND slot2.slot_order = 2
    WHERE slot1.day_of_week = 6  -- Saturday
      AND slot1.slot_order = 1  -- First slot (AM)
    UNION
    -- Handle case where only PM exists (no AM slot)
    SELECT
      TO_CHAR(slot2.start_time, 'HH12:MI AM') || ' - ' || 
      TO_CHAR(slot2.end_time, 'HH12:MI AM') AS schedule_text
    FROM user_schedule slot2
    WHERE slot2.day_of_week = 6
      AND slot2.slot_order = 2
      AND NOT EXISTS (
        SELECT 1 FROM user_schedule s1 
        WHERE s1.day_of_week = 6 AND s1.slot_order = 1
      )
    LIMIT 1
  ),
  month_sessions AS (
    -- Get all completed, scheduled sessions for the month
    SELECT
      s.id,
      s.arrival,
      s.departure,
      s.time_balance,
      EXTRACT(DAY FROM s.arrival AT TIME ZONE 'Asia/Manila')::INTEGER AS day_num,
      ROW_NUMBER() OVER (
        PARTITION BY DATE(s.arrival AT TIME ZONE 'Asia/Manila')
        ORDER BY s.arrival
      ) AS session_order
    FROM session s
    WHERE s.user_id = p_user_id
      AND s.is_active = false     -- Only completed sessions
      AND s.arrival >= (p_month || '-01')::DATE
      AND s.arrival < (p_month || '-01')::DATE + INTERVAL '1 month'
  ),
  am_sessions AS (
    -- First session of the day = AM
    -- Calculate undertime: if time_balance is negative, convert to positive; if positive, return 0
    SELECT
      day_num,
      arrival AS am_arrival,
      departure AS am_departure,
      CASE 
        WHEN time_balance < 0 THEN ABS(time_balance)
        ELSE 0
      END AS am_undertime
    FROM month_sessions
    WHERE session_order = 1
  ),
  pm_sessions AS (
    -- Second session of the day = PM
    -- Calculate undertime: if time_balance is negative, convert to positive; if positive, return 0
    SELECT
      day_num,
      arrival AS pm_arrival,
      departure AS pm_departure,
      CASE 
        WHEN time_balance < 0 THEN ABS(time_balance)
        ELSE 0
      END AS pm_undertime
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
    COALESCE((SELECT schedule_text FROM regular_days_schedule LIMIT 1), '') AS regular_days_schedule,
    COALESCE((SELECT schedule_text FROM saturdays_schedule LIMIT 1), '') AS saturdays_schedule
  FROM am_sessions am
  FULL OUTER JOIN pm_sessions pm ON am.day_num = pm.day_num
  ORDER BY day_number;
END;
$$ LANGUAGE plpgsql STABLE;
