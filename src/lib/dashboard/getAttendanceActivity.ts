"use server";

// export type AttendancePeriod = "04:00-19:00" | "00:00-23:59";
// export type AttendanceChartGranule = "1 hour" | "30 minutes" | "15 minutes";
// export type UserRole = "ALL" | "STUDENT" | "EMPLOYEE";

import { createClient } from "@/utils/supabase/server";
import {
  AttendanceChartInterval,
  AttendancePeriod,
  AttendancePoint,
  UserRole,
} from "./types";

export interface IAttendanceActivityFilter {
  date: string;
  period: AttendancePeriod;
  role: UserRole;
  interval: AttendanceChartInterval;
}

interface AttendanceTrend {
  data: AttendancePoint[];
  error?: string;
}

export const getAttendanceActivity = async ({
  date,
  period,
  role,
  interval,
}: IAttendanceActivityFilter): Promise<AttendanceTrend> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_attendance_trend", {
      p_date: new Date(date).toISOString(),
      p_period: period,
      p_role: role,
      p_interval: interval,
    });

    if (error) {
      return { data: [], error: error.message };
    } else {
      return { data };
    }
  } catch (error) {
    console.log(`lib.dashboard.attendanceTrend.getDailyTrend :: ${error}`);
    return { data: [], error: `Failed to fetch data: ${error}` };
  }
};

/**

-- Supabase sql command for creating the rpc functions
-- DO NOT REMOVE FOR FUTURE REFERENCES

drop function if exists public.get_attendance_trend(timestamptz, text, text, text);

create or replace function public.get_attendance_trend(
    p_date timestamptz,
    p_period text,       -- literal time range, e.g., '04:00-19:00' or '00:00-23:59'
    p_role text,         -- 'ALL', 'EMPLOYEE', 'STUDENT'
    p_interval text      -- '1 hour' | '30 minutes' | '15 minutes'
)
returns table (
    hour text,
    timein int,
    timeout int,
    occupancy int
)
language plpgsql
as $$
declare
    start_time timestamptz;
    end_time timestamptz;
    step interval;
    initial_occupancy int;
    start_offset interval;
    end_offset interval;
begin
    -- Parse p_period literal 'HH24:MI-HH24:MI'
    start_offset := split_part(p_period,'-',1)::interval;
    end_offset   := split_part(p_period,'-',2)::interval;

    start_time := date_trunc('day', p_date at time zone 'Asia/Manila') + start_offset;
    end_time   := date_trunc('day', p_date at time zone 'Asia/Manila') + end_offset;

    -- Step interval
    step := p_interval::interval;

    -- Initial occupancy before start_time
    select coalesce(sum(case when action = 'TIME_IN' then 1 when action = 'TIME_OUT' then -1 end),0)
    into initial_occupancy
    from public.attendance_log l
    join public."user" u on l.user_id = u.user_id
    left join public.student st on st.user_id = u.user_id
    left join public.employee e on e.user_id = u.user_id
    where (l.timestamp at time zone 'Asia/Manila') < start_time
      and (
            p_role = 'ALL'
            or (p_role = 'STUDENT' and st.user_id is not null)
            or (p_role = 'EMPLOYEE' and e.user_id is not null)
          );

    return query
    with filtered as (
        select l.*,
               case when action = 'TIME_IN' then 1 else -1 end as delta
        from public.attendance_log l
        join public."user" u on l.user_id = u.user_id
        left join public.student st on st.user_id = u.user_id
        left join public.employee e on e.user_id = u.user_id
        where (l.timestamp at time zone 'Asia/Manila') >= start_time
          and (l.timestamp at time zone 'Asia/Manila') < end_time
          and (
            p_role = 'ALL'
            or (p_role = 'STUDENT' and st.user_id is not null)
            or (p_role = 'EMPLOYEE' and e.user_id is not null)
          )
    ),
    bucketed as (
        select
            date_bin(step, timestamp at time zone 'Asia/Manila', start_time) as bucket,
            count(*) filter (where action = 'TIME_IN')::int as timein,
            count(*) filter (where action = 'TIME_OUT')::int as timeout,
            sum(delta) as delta
        from filtered
        group by bucket
    ),
    buckets as (
        select gs as bucket
        from generate_series(start_time, end_time, step) gs
    ),
    merged as (
        select b.bucket,
               coalesce(bb.timein,0) as timein,
               coalesce(bb.timeout,0) as timeout,
               coalesce(bb.delta,0) as delta
        from buckets b
        left join bucketed bb on bb.bucket = b.bucket
        order by b.bucket
    )
    select
        to_char(m.bucket, 'HH24:MI')::text as hour,
        m.timein,
        m.timeout,
        (coalesce(sum(m.delta) over (order by m.bucket rows unbounded preceding),0) 
         + initial_occupancy)::int as occupancy
    from merged m;

end;
$$;


 */
