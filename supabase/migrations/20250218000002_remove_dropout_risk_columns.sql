-- Migration: Remove old dropout risk columns and update RPC function
-- Replaces dropout_risk columns with attendance_forecast columns

-- First, update the RPC function to use attendance_forecast instead of dropout_risk
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
  attendance_forecast_probability NUMERIC,
  attendance_forecast_confidence NUMERIC
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
    d.attendance_forecast_probability,
    d.attendance_forecast_confidence
  FROM public.daily_user_performance d
  JOIN public."user" u ON u.id = d.user_id
  LEFT JOIN public.student st ON st.user_id = d.user_id
  LEFT JOIN public.employee e ON e.user_id = d.user_id
  WHERE d.attendance_forecast_probability < 0.5  -- At risk if forecast probability < 50%
    AND (d.created_at AT TIME ZONE 'Asia/Manila')::date = p_date
    AND (
      p_role = 'ALL'
      OR d.user_type = p_role
    )
  ORDER BY d.attendance_forecast_probability ASC NULLS LAST;  -- Lower probability = higher risk
END;
$$ LANGUAGE plpgsql STABLE;

-- Remove old dropout_risk columns from daily_user_performance table
ALTER TABLE public.daily_user_performance
    DROP COLUMN IF EXISTS dropout_risk_level,
    DROP COLUMN IF EXISTS dropout_risk_percentage,
    DROP COLUMN IF EXISTS dropout_risk_confidence,
    DROP COLUMN IF EXISTS dropout_risk_factors;

-- Add comment explaining the change
COMMENT ON FUNCTION public.get_at_risk_user_details IS 'Returns users at risk based on attendance_forecast_probability < 0.5 (replaces old dropout_risk_level logic)';

