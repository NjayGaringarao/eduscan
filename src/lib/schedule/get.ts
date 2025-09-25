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
          'slot_id', ss.slot_id,
          'schedule_id', ss.schedule_id,
          'day_of_week', ss.day_of_week,
          'end_day_of_week', ss.end_day_of_week,
          'start_time', ss.start_time,
          'end_time', ss.end_time,
          'label', ss.label
        )
        order by ss.day_of_week, ss.start_time
      ) filter (where ss.slot_id is not null),
      '[]'::jsonb
    ) as slots
  from schedule s
  left join schedule_slot ss on s.schedule_id = ss.schedule_id
  where p_schedule_id is null or s.schedule_id = p_schedule_id
  group by s.schedule_id, s.name, s.description, s.user_type, s.is_active, s.created_at
  order by s.created_at desc;
end;
$$;

 */
