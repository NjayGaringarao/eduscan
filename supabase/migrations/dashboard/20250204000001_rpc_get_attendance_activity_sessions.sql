DROP FUNCTION IF EXISTS public.get_attendance_activity_sessions(date, text);

CREATE OR REPLACE FUNCTION public.get_attendance_activity_sessions(
  p_date DATE,
  p_role TEXT
)
RETURNS TABLE (
  user_id TEXT,
  full_name TEXT,
  time_in TIMESTAMPTZ,
  time_out TIMESTAMPTZ,
  duration_minutes INTEGER,
  role TEXT,
  title_program TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.user_id,
    TRIM(CONCAT(u.last_name, ', ', u.first_name, ' ', COALESCE(u.middle_name, ''))) AS full_name,
    s.arrival AS time_in,
    s.departure AS time_out,
    COALESCE(ROUND(EXTRACT(EPOCH FROM (s.departure - s.arrival)) / 60)::int, 0) AS duration_minutes,
    CASE
      WHEN st.user_id IS NOT NULL THEN 'STUDENT'
      WHEN e.user_id IS NOT NULL THEN 'EMPLOYEE'
      ELSE 'UNKNOWN'
    END AS role,
    CASE
      WHEN st.user_id IS NOT NULL THEN COALESCE(st.program, '')
      WHEN e.user_id IS NOT NULL THEN COALESCE(e.title, '')
      ELSE ''
    END AS title_program
  FROM public.session s
  JOIN public."user" u ON u.id = s.user_id
  LEFT JOIN public.student st ON st.user_id = s.user_id
  LEFT JOIN public.employee e ON e.user_id = s.user_id
  WHERE s.is_active = false
    AND s.arrival IS NOT NULL
    AND s.departure IS NOT NULL
    AND ((s.arrival AT TIME ZONE 'Asia/Manila')::date = p_date)
    AND (
      p_role = 'ALL'
      OR (p_role = 'STUDENT' AND st.user_id IS NOT NULL)
      OR (p_role = 'EMPLOYEE' AND e.user_id IS NOT NULL)
    )
  ORDER BY s.arrival;
END;
$$ LANGUAGE plpgsql STABLE;


