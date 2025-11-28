drop function if exists public.get_user(text);

create or replace function public.get_user(
  p_user_id text
)
returns table (
  id text,
  first_name text,
  middle_name text,
  last_name text,
  picture_id text,
  sex text,
  birth_date date,
  address text,
  schedule_id bigint,
  student jsonb,
  guardian jsonb,
  employee jsonb,
  has_facial_encoding boolean
) as $$
begin
  return query
  select
    u.id,
    u.first_name,
    u.middle_name,
    u.last_name,
    u.picture_id,
    u.sex,
    u.birth_date,
    u.address,
    u.schedule_id,
    case
      when s.user_id is not null then jsonb_build_object(
        'department', s.department,
        'program', s.program
      )
      else null
    end as student,
    case
      when g.user_id is not null then jsonb_build_object(
        'first_name', g.first_name,
        'middle_name', g.middle_name,
        'last_name', g.last_name,
        'sex', g.sex,
        'address', g.address,
        'contact_number', g.contact_number
      )
      else null
    end as guardian,
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
  left join guardian g on g.user_id = u.id
  left join employee e on e.user_id = u.id
  where u.id = p_user_id
  limit 1;
end;
$$ language plpgsql security definer;


