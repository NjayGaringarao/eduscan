
DROP FUNCTION IF EXISTS public.get_available_users(text);

CREATE OR REPLACE FUNCTION public.get_available_users(
  p_role text default 'ALL'
)
RETURNS TABLE (
  id text,
  first_name text,
  middle_name text,
  last_name text,
  picture_id text,
  schedule_id bigint,
  student jsonb,
  employee jsonb,
  has_facial_encoding boolean
) AS $$
DECLARE
  v_role text := upper(coalesce(p_role, 'ALL'));
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.first_name,
    u.middle_name,
    u.last_name,
    u.picture_id,
    u.schedule_id,
    CASE
      WHEN s.user_id IS NOT NULL THEN jsonb_build_object(
        'department', s.department,
        'program', s.program
      )
      ELSE NULL
    END AS student,
    CASE
      WHEN e.user_id IS NOT NULL THEN jsonb_build_object(
        'type', e.type,
        'division', e.division,
        'title', e.title,
        'contact_number', e.contact_number
      )
      ELSE NULL
    END AS employee,
    coalesce(cardinality(u.facial_encoding) > 0, false) AS has_facial_encoding
  FROM "user" u
  LEFT JOIN student s ON s.user_id = u.id
  LEFT JOIN employee e ON e.user_id = u.id
  WHERE
    u.schedule_id IS NULL
    AND (
      v_role = 'ALL'
      OR (v_role = 'EMPLOYEE' AND e.user_id IS NOT NULL)
      OR (v_role = 'STUDENT' AND s.user_id IS NOT NULL)
    )
  ORDER BY u.last_name, u.first_name
  LIMIT 3000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
