drop function if exists public.get_available_users(bigint, text);

create or replace function public.get_available_users(
  p_user_type text default 'ALL'
)
returns table (
  id text,
  first_name text,
  middle_name text,
  last_name text,
  picture_id text,
  schedule_id bigint,
  student jsonb,
  employee jsonb,
  has_facial_encoding boolean
) as $$
declare
  v_type text := upper(coalesce(p_user_type, 'ALL'));
begin
  return query
  select
    u.id,
    u.first_name,
    u.middle_name,
    u.last_name,
    u.picture_id,
    u.schedule_id,
    case
      when s.user_id is not null then jsonb_build_object(
        'department', s.department,
        'program', s.program
      )
      else null
    end as student,
    case
      when e.user_id is not null then jsonb_build_object(
        'type', e.type,
        'division', e.division,
        'title', e.title,
        'contact_number', e.contact_number
      )
      else null
    end as employee,
    coalesce(cardinality(u.facial_encoding) > 0, false) as has_facial_encoding
  from "user" u
  left join student s on s.user_id = u.id
  left join employee e on e.user_id = u.id
  where
    -- Only return users with no linked schedule
    u.schedule_id is null
    and (
      -- Filter by user type if provided
      v_type = 'ALL'
      or (v_type = 'STUDENT' and s.user_id is not null)
      or (v_type = 'EMPLOYEE' and e.user_id is not null)
    )
  order by u.last_name, u.first_name
  limit 3000;
end;
$$ language plpgsql security definer;
