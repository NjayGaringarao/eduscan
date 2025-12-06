DROP FUNCTION IF EXISTS public.get_session_log(
  date,
  text,
  text,
  text,
  text,
  text,
  text
);

CREATE OR REPLACE FUNCTION public.get_session_log(
  p_date DATE,
  p_user_type TEXT DEFAULT 'ALL',
  p_student_department TEXT DEFAULT 'ALL',
  p_student_program TEXT DEFAULT 'ALL',
  p_employee_type TEXT DEFAULT 'ALL',
  p_employee_division TEXT DEFAULT 'ALL',
  p_employee_title TEXT DEFAULT 'ALL'
)
RETURNS TABLE (
  session_id BIGINT,
  user_id TEXT,
  full_name TEXT,
  time_in TIMESTAMPTZ,
  time_out TIMESTAMPTZ,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS session_id,
    s.user_id,
    TRIM(CONCAT(
      COALESCE(u.last_name, ''),
      ', ',
      COALESCE(u.first_name, ''),
      ' ',
      COALESCE(u.middle_name, '')
    )) AS full_name,
    s.arrival AS time_in,
    s.departure AS time_out,
    s.is_active
  FROM public.session s
  JOIN public."user" u ON u.id = s.user_id
  LEFT JOIN public.student st ON st.user_id = s.user_id
  LEFT JOIN public.employee e ON e.user_id = s.user_id
  WHERE s.arrival IS NOT NULL
    AND ((s.arrival AT TIME ZONE 'Asia/Manila')::date = p_date)
    -- User type filter
    AND (
      p_user_type = 'ALL'
      OR (p_user_type = 'STUDENT' AND st.user_id IS NOT NULL)
      OR (p_user_type = 'EMPLOYEE' AND e.user_id IS NOT NULL)
    )
    -- Student filters
    AND (
      p_user_type != 'STUDENT'
      OR (
        (p_student_department = 'ALL' OR st.department = p_student_department)
        AND (p_student_program = 'ALL' OR st.program = p_student_program)
      )
    )
    -- Employee filters
    AND (
      p_user_type != 'EMPLOYEE'
      OR (
        (p_employee_type = 'ALL' OR e.type = p_employee_type)
        AND (p_employee_division = 'ALL' OR e.division = p_employee_division)
        AND (p_employee_title = 'ALL' OR e.title = p_employee_title)
      )
    )
  ORDER BY s.arrival;
END;
$$ LANGUAGE plpgsql STABLE;

