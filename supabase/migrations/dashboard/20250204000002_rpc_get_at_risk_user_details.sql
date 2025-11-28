DROP FUNCTION IF EXISTS public.get_at_risk_user_details(date, text);

CREATE OR REPLACE FUNCTION public.get_at_risk_user_details(
  p_date DATE,
  p_role TEXT
)
RETURNS TABLE (
  user_id TEXT,
  full_name TEXT,
  user_role TEXT,
  department TEXT,
  division TEXT,
  program TEXT,
  title TEXT,
  average_punctuality_value NUMERIC,
  average_punctuality_label TEXT,
  average_time_balance_value NUMERIC,
  average_time_balance_label TEXT,
  dropout_risk_percentage NUMERIC,
  dropout_risk_confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.user_id,
    TRIM(CONCAT(u.last_name, ', ', u.first_name, ' ', COALESCE(u.middle_name, ''))) AS full_name,
    d.user_type AS user_role,
    st.department,
    e.division,
    st.program,
    e.title,
    d.average_punctuality_value,
    d.average_punctuality_label,
    d.average_time_balance_value,
    d.average_time_balance_label,
    d.dropout_risk_percentage,
    d.dropout_risk_confidence
  FROM public.daily_user_performance d
  JOIN public."user" u ON u.id = d.user_id
  LEFT JOIN public.student st ON st.user_id = d.user_id
  LEFT JOIN public.employee e ON e.user_id = d.user_id
  WHERE d.dropout_risk_level = 'AT_RISK'
    AND (d.created_at AT TIME ZONE 'Asia/Manila')::date = p_date
    AND (
      p_role = 'ALL'
      OR d.user_type = p_role
    )
  ORDER BY d.dropout_risk_percentage DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;


