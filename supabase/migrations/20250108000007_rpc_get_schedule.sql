-- New RPC: get_schedule_v2
-- Similar to get_schedule but without user_type field (generic schedules)

DROP FUNCTION IF EXISTS public.get_schedule(bigint);

CREATE OR REPLACE FUNCTION public.get_schedule(p_schedule_id bigint default null)
RETURNS TABLE (
  id bigint,
  name text,
  description text,
  created_at timestamp,
  slots jsonb,
  users jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.description,
    s.created_at,
    (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', sl.id,
            'schedule_id', sl.schedule_id,
            'day_of_week', sl.day_of_week,
            'start_time', sl.start_time,
            'end_time', sl.end_time,
            'label', sl.label
          ) ORDER BY sl.day_of_week, sl.start_time
        ), '[]'::jsonb
      )
      FROM slot sl
      WHERE sl.schedule_id = s.id
    ) AS slots,
    CASE
      WHEN p_schedule_id IS NOT NULL THEN (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', u.id,
              'first_name', u.first_name,
              'middle_name', u.middle_name,
              'last_name', u.last_name,
              'sex', u.sex,
              'birth_date', u.birth_date,
              'address', u.address,
              'picture_id', u.picture_id,
              'has_facial_encoding', coalesce(cardinality(u.facial_encoding) > 0, false),
              'schedule_id', u.schedule_id,
              'student', CASE WHEN st.user_id IS NOT NULL THEN jsonb_build_object('user_id', st.user_id, 'department', st.department, 'program', st.program) ELSE NULL END,
              'employee', CASE WHEN emp.user_id IS NOT NULL THEN jsonb_build_object('user_id', emp.user_id, 'type', emp.type, 'division', emp.division, 'title', emp.title, 'contact_number', emp.contact_number) ELSE NULL END,
              'guardian', CASE WHEN g.user_id IS NOT NULL THEN jsonb_build_object('user_id', g.user_id, 'first_name', g.first_name, 'middle_name', g.middle_name, 'last_name', g.last_name, 'sex', g.sex, 'address', g.address, 'contact_number', g.contact_number) ELSE NULL END
            ) ORDER BY u.first_name, u.last_name
          ), '[]'::jsonb
        )
        FROM "user" u
        LEFT JOIN student st ON u.id = st.user_id
        LEFT JOIN employee emp ON u.id = emp.user_id
        LEFT JOIN guardian g ON u.id = g.user_id
        WHERE u.schedule_id = s.id
      )
      ELSE (
        to_jsonb((SELECT COUNT(*) FROM "user" u WHERE u.schedule_id = s.id))
      )
    END AS users
  FROM schedule s
  WHERE (p_schedule_id IS NULL) OR (p_schedule_id IS NOT NULL AND s.id = p_schedule_id)
  ORDER BY s.created_at DESC;
END;
$$;
