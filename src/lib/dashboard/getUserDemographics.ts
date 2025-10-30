"use server";

import { createClient } from "@/utils/supabase/server";
import { ComparisonValue, ComparisonMode, UserSet } from "./types";

export const getUserDemographics = async (
  userSet: UserSet,
  comparison: ComparisonMode
): Promise<{
  data: ComparisonValue[];
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_user_demographics", {
      user_set: userSet,
      comparison: comparison,
    });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: data };
  } catch (error) {
    console.log(`lib.dashboard.getDemograhics :: ${error}`);
    return { data: [], error: `Failed to fetch data: ${error}` };
  }
};

/**

-- Supabase sql command for creating the get_user_demographics function
-- DO NOT REMOVE FOR FUTURE REFERENCES
 
drop function if exists public.get_user_demographics(text, text);

create or replace function public.get_user_demographics(
  user_set text,
  comparison text
)
returns table (name text, value int, color text)
language plpgsql
as $$
begin
  -- EMPLOYEE vs STUDENT
  if comparison = 'EMPLOYEE_VS_STUDENT' then
    if user_set = 'TOTAL' then
      return query
      select 'Employees'::text, count(*)::int, '#3182CE'::text
      from public.employee
      union all
      select 'Students'::text, count(*)::int, '#38A169'::text
      from public.student;
    elsif user_set = 'PRESENT' then
      return query
      select 'Employees'::text, count(*)::int, '#3182CE'::text
      from public.session s
      join public.employee e on s.user_id = e.user_id
      where s.is_active = true
      union all
      select 'Students'::text, count(*)::int, '#38A169'::text
      from public.session s
      join public.student st on s.user_id = st.user_id
      where s.is_active = true;
    end if;

  -- MALE vs FEMALE
  elsif comparison = 'MALE_VS_FEMALE' then
    if user_set = 'TOTAL' then
      return query
      select 'Male'::text, count(*)::int, '#4299E1'::text
      from public."user"
      where sex = 'MALE'
      union all
      select 'Female'::text, count(*)::int, '#ED64A6'::text
      from public."user"
      where sex = 'FEMALE';
    elsif user_set = 'PRESENT' then
      return query
      select 'Male'::text, count(*)::int, '#4299E1'::text
      from public.session s
      join public."user" u on s.user_id = u.id
      where u.sex = 'MALE' and s.is_active = true
      union all
      select 'Female'::text, count(*)::int, '#ED64A6'::text
      from public.session s
      join public."user" u on s.user_id = u.id
      where u.sex = 'FEMALE' and s.is_active = true;
    end if;

  -- AGE GROUPS
  elsif comparison = 'AGE_GROUPS' then
    if user_set = 'TOTAL' then
      return query
      select 'Under 18'::text, count(*)::int, '#805AD5'::text
      from public."user"
      where birth_date is not null and age(birth_date) < interval '18 years'
      union all
      select '18-25'::text, count(*)::int, '#DD6B20'::text
      from public."user"
      where birth_date is not null and age(birth_date) between interval '18 years' and interval '25 years'
      union all
      select '26-40'::text, count(*)::int, '#2B6CB0'::text
      from public."user"
      where birth_date is not null and age(birth_date) between interval '26 years' and interval '40 years'
      union all
      select '41-60'::text, count(*)::int, '#38B2AC'::text
      from public."user"
      where birth_date is not null and age(birth_date) between interval '41 years' and interval '60 years'
      union all
      select '60+'::text, count(*)::int, '#E53E3E'::text
      from public."user"
      where birth_date is not null and age(birth_date) > interval '60 years';
    elsif user_set = 'PRESENT' then
      return query
      select 'Under 18'::text, count(*)::int, '#805AD5'::text
      from public.session s
      join public."user" u on s.user_id = u.id
      where u.birth_date is not null and age(u.birth_date) < interval '18 years' and s.is_active = true
      union all
      select '18-25'::text, count(*)::int, '#DD6B20'::text
      from public.session s
      join public."user" u on s.user_id = u.id
      where u.birth_date is not null and age(u.birth_date) between interval '18 years' and interval '25 years' and s.is_active = true
      union all
      select '26-40'::text, count(*)::int, '#2B6CB0'::text
      from public.session s
      join public."user" u on s.user_id = u.id
      where u.birth_date is not null and age(u.birth_date) between interval '26 years' and interval '40 years' and s.is_active = true
      union all
      select '41-60'::text, count(*)::int, '#38B2AC'::text
      from public.session s
      join public."user" u on s.user_id = u.id
      where u.birth_date is not null and age(u.birth_date) between interval '41 years' and interval '60 years' and s.is_active = true
      union all
      select '60+'::text, count(*)::int, '#E53E3E'::text
      from public.session s
      join public."user" u on s.user_id = u.user_id
      where u.birth_date is not null and age(u.birth_date) > interval '60 years' and s.is_active = true;
    end if;

  else
    return query
    select 'Unknown'::text, 0::int, '#CBD5E0'::text;
  end if;
end;
$$;


 */
