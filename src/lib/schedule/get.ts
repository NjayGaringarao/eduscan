"use server";

import { ExtendedSchedule } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const getById = async (
  schedule_id: string
): Promise<{
  schedule: ExtendedSchedule | null;
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_schedule", {
      p_schedule_id: schedule_id,
    });

    if (error) {
      return { schedule: null, error: error.message };
    }

    // Since only one schedule is expected, take the first item
    return { schedule: data?.[0] ?? null };
  } catch (error) {
    console.log(`lib.schedule.get.getById :: ${error}`);
    return { schedule: null, error: `Failed to fetch data: ${error}` };
  }
};

export const getAll = async (): Promise<{
  schedules: ExtendedSchedule[];
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_schedule");

    if (error) {
      return { schedules: [], error: error.message };
    }

    return { schedules: data ?? [] };
  } catch (error) {
    console.log(`lib.schedule.get.getAll :: ${error}`);
    return { schedules: [], error: `Failed to fetch data: ${error}` };
  }
};

/**

-- Supabase sql command for creating the rpc functions
-- DO NOT REMOVE FOR FUTURE REFERENCES

drop function if exists public.get_schedule(bigint);

create or replace function get_schedule(p_schedule_id bigint default null)
returns table (
  schedule_id bigint,
  name text,
  description text,
  user_type text,
  is_active boolean,
  created_at timestamp,
  slots jsonb,
  users jsonb
)
language plpgsql
as $$
begin
  return query
  select 
    s.schedule_id,
    s.name,
    s.description,
    s.user_type,
    s.is_active,
    s.created_at,
    -- Get slots using subquery to avoid Cartesian product
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'slot_id', sl.slot_id,
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
      where sl.schedule_id = s.schedule_id
    ) as slots,
    case 
      when p_schedule_id is not null then
        -- Return full user objects when getting specific schedule (getById)
        (
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'user_id', u.user_id,
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
          left join student st on u.user_id = st.user_id
          left join employee emp on u.user_id = emp.user_id
          left join guardian g on u.user_id = g.user_id
          where u.schedule_id = s.schedule_id
        )
      else
        -- Return user count as JSON number when getting all schedules (getAll)
        to_jsonb(
          (
            select count(*)
            from "user" u
            where u.schedule_id = s.schedule_id
          )
        )
      end as users
  from schedule s
  where (p_schedule_id is null and s.is_active = true) or (p_schedule_id is not null and s.schedule_id = p_schedule_id)
  order by s.created_at desc;
end;
$$;

 */
