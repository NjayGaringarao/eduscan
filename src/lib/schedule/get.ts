"use server";

import { Schedule } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const getById = async (
  schedule_id: string
): Promise<{ schedule: Schedule | null; error?: string }> => {
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
  schedules: Schedule[];
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

create or replace function get_schedule(p_schedule_id bigint default null)
returns table (
  schedule_id bigint,
  name text,
  description text,
  user_type text,
  is_active boolean,
  created_at timestamp,
  slots jsonb
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
    coalesce(
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
      ) filter (where sl.slot_id is not null),
      '[]'::jsonb
    ) as slots
  from schedule s
  left join slot sl on s.schedule_id = sl.schedule_id
  where p_schedule_id is null or s.schedule_id = p_schedule_id
  group by s.schedule_id, s.name, s.description, s.user_type, s.is_active, s.created_at
  order by s.created_at desc;
end;
$$;

 */
