-- Returns: Per-session attendance records (Time In / Time Out / Total Hours)
-- for a user within a date range. Used by the admin "Sessions" tab on /user.

DROP FUNCTION IF EXISTS public.get_user_attendance(text, date, date);

CREATE OR REPLACE FUNCTION public.get_user_attendance(
  p_user_id TEXT,
  p_start DATE,
  p_end DATE
)
RETURNS TABLE(
  date_start DATE,
  date_end DATE,
  time_in TIMESTAMPTZ,
  time_out TIMESTAMPTZ,
  total_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (s.arrival AT TIME ZONE 'Asia/Manila')::DATE AS date_start,
    -- Only set when a completed session's departure lands on a different
    -- calendar day than its arrival (e.g. an overnight shift).
    CASE
      WHEN s.departure IS NOT NULL
        AND (s.departure AT TIME ZONE 'Asia/Manila')::DATE
          <> (s.arrival AT TIME ZONE 'Asia/Manila')::DATE
      THEN (s.departure AT TIME ZONE 'Asia/Manila')::DATE
      ELSE NULL
    END AS date_end,
    s.arrival AS time_in,
    s.departure AS time_out,
    CASE
      WHEN s.departure IS NOT NULL
      THEN EXTRACT(EPOCH FROM (s.departure - s.arrival)) / 3600.0
      ELSE NULL
    END AS total_hours
  FROM session s
  WHERE s.user_id = p_user_id
    AND (s.arrival AT TIME ZONE 'Asia/Manila')::DATE >= p_start
    AND (s.arrival AT TIME ZONE 'Asia/Manila')::DATE <= p_end
  ORDER BY s.arrival;
END;
$$ LANGUAGE plpgsql STABLE;
