"use server";

import { createClient } from "@/utils/supabase/server";
import { ComparisonValue, ComparisonMode } from "./types";

export const getUserDemographics = async (
  comparison: ComparisonMode
): Promise<{
  data: ComparisonValue[];
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_user_demographics", {
      comparison,
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
 
create or replace function get_user_demographics(comparison text)
returns table (name text, value int, color text)
language plpgsql
as $$
begin
  if comparison = 'EMPLOYEE_VS_STUDENT' then
    return query
    select 'Employees'::text as name,
           count(*)::int as value,
           '#3182CE'::text as color   -- blue
    from public.employee
    union all
    select 'Students'::text as name, 
           count(*)::int as value, 
           '#38A169'::text as color -- green
    from public.student;

  elsif comparison = 'MALE_VS_FEMALE' then
    return query
    select 'Male'::text as name, 
           count(*)::int as value, 
           '#4299E1'::text as color -- light blue
    from public."user"
    where sex = 'MALE'
    union all
    select 'Female'::text as name, 
           count(*)::int as value, 
           '#ED64A6'::text as color -- pink
    from public."user"
    where sex = 'FEMALE';

  elsif comparison = 'AGE_GROUPS' then
    return query
    select 'Under 18'::text as name,
           count(*)::int as value,
           '#805AD5'::text as color  -- purple
    from public."user"
    where birth_date is not null
      and age(birth_date) < interval '18 years'
    union all
    select '18-25'::text as name,
           count(*)::int as value,
           '#DD6B20'::text as color
    from public."user"
    where birth_date is not null
      and age(birth_date) between interval '18 years' and interval '25 years'
    union all
    select '26-40'::text as name,
           count(*)::int as value,
           '#2B6CB0'::text as color
    from public."user"
    where birth_date is not null
      and age(birth_date) between interval '26 years' and interval '40 years'
    union all
    select '41-60'::text as name,
           count(*)::int as value,
           '#38B2AC'::text as color
    from public."user"
    where birth_date is not null
      and age(birth_date) between interval '41 years' and interval '60 years'
    union all
    select '60+'::text as name,
           count(*)::int as value,
           '#E53E3E'::text as color
    from public."user"
    where birth_date is not null
      and age(birth_date) > interval '60 years';

  else
    return query
    select 'Unknown'::text as name, 
           0::int as value, 
           '#CBD5E0'::text as color; -- fallback (gray)
  end if;
end;
$$;

 */
