
drop function if exists public.get_schedule(bigint);

create or replace function get_schedule(p_schedule_id bigint default null)
returns table (
  id bigint,
  name text,
  description text,
  user_type text,
  created_at timestamp,
  slots jsonb,
  users jsonb
)
language plpgsql
as $$
begin
  return query
  select 
    s.id,
    s.name,
    s.description,
    s.user_type,
    s.created_at,
    -- Get slots using subquery to avoid Cartesian product
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', sl.id,
            'schedule_id', sl.schedule_id,
            'day_of_week', sl.day_of_week,
            'start_time', sl.start_time,
            'end_time', sl.end_time,
            'label', sl.label
          )
          order by sl.day_of_week, sl.start_time
        ),
        '[]'::jsonb
      )
      from slot sl
      where sl.schedule_id = s.id
    ) as slots,
    case 
      when p_schedule_id is not null then
        -- Return full user objects when getting specific schedule (getById)
        (
          select coalesce(
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
                'facial_encoding', u.facial_encoding,
                'schedule_id', u.schedule_id,
                'student', case 
                  when st.user_id is not null then
                    jsonb_build_object(
                      'user_id', st.user_id,
                      'department', st.department,
                      'program', st.program
                    )
                  else null
                end,
                'employee', case 
                  when emp.user_id is not null then
                    jsonb_build_object(
                      'user_id', emp.user_id,
                      'type', emp.type,
                      'division', emp.division,
                      'title', emp.title,
                      'contact_number', emp.contact_number
                    )
                  else null
                end,
                'guardian', case 
                  when g.user_id is not null then
                    jsonb_build_object(
                      'user_id', g.user_id,
                      'first_name', g.first_name,
                      'middle_name', g.middle_name,
                      'last_name', g.last_name,
                      'sex', g.sex,
                      'address', g.address,
                      'contact_number', g.contact_number
                    )
                  else null
                end
              )
              order by u.first_name, u.last_name
            ),
            '[]'::jsonb
          )
          from "user" u
          left join student st on u.id = st.user_id
          left join employee emp on u.id = emp.user_id
          left join guardian g on u.id = g.user_id
          where u.schedule_id = s.id
        )
      else
        -- Return user count as JSON number when getting all schedules (getAll)
        to_jsonb(
          (
            select count(*)
            from "user" u
            where u.schedule_id = s.id
          )
        )
      end as users
  from schedule s
  where (p_schedule_id is null) or (p_schedule_id is not null and s.id = p_schedule_id)
  order by s.created_at desc;
end;
$$;
