"use server";

import { createClient } from "@/utils/supabase/server";
import { RealtimeUserStatus } from "./types";

export const getUserStatus = async (): Promise<{
  realtimeStatus?: RealtimeUserStatus;
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_user_status");

    if (error) {
      return { error: error.message };
    }
    return { realtimeStatus: data };
  } catch (error) {
    console.log(`lib.dashboard.getUserStatus :: ${error}`);
    return { error: `Failed to fetch data: ${error}` };
  }
};

/**

-- Supabase sql command for creating the realtime function
-- DO NOT REMOVE FOR FUTURE REFERENCES

create or replace function get_user_status()
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'totalUser', (select count(*) from public."user"),
    'presentUser', (select count(*) from public.session where is_active = true),
    'totalEmployee', (select count(*) from public.employee),
    'totalStudent', (select count(*) from public.student),
    'presentStudent', (
      select count(*) 
      from public.session s
      join public.student st on s.user_id = st.user_id
      where s.is_active = true
    ),
    'presentEmployee', (
      select count(*) 
      from public.session s
      join public.employee e on s.user_id = e.user_id
      where s.is_active = true
    )
  )
  into result;

  return result;
end;
$$ language plpgsql stable;


 */
