drop function if exists public.update_user(jsonb, jsonb, jsonb, double precision[], boolean);

create or replace function public.update_user(
  p_user jsonb,
  p_organizational jsonb,
  p_guardian jsonb,
  p_facial_encoding double precision[] default null,
  p_update_facial_encoding boolean default false
)
returns void as $$
declare
  v_role text;
  v_user_id text := p_organizational->>'user_id';
begin
  perform pg_advisory_xact_lock(1);

  update "user"
  set
    first_name      = p_user->>'first_name',
    middle_name     = p_user->>'middle_name',
    last_name       = p_user->>'last_name',
    sex             = upper(p_user->>'sex'),
    birth_date      = (p_user->>'birth_date')::date,
    address         = p_user->>'address',
    facial_encoding = case
      when p_update_facial_encoding then p_facial_encoding
      else facial_encoding
    end
  where id = v_user_id;

  if exists (select 1 from student where user_id = v_user_id) then
    v_role := 'STUDENT';
  elsif exists (select 1 from employee where user_id = v_user_id) then
    v_role := 'EMPLOYEE';
  end if;

  if p_organizational->>'role' = 'STUDENT' then
    if v_role = 'STUDENT' then
      update student
      set department = p_organizational->>'department',
          program    = p_organizational->>'program'
      where user_id = v_user_id;
    else
      delete from employee where user_id = v_user_id;
      insert into student (user_id, department, program)
      values (
        v_user_id,
        p_organizational->>'department',
        p_organizational->>'program'
      );
    end if;

  elsif p_organizational->>'role' = 'EMPLOYEE' then
    if v_role = 'EMPLOYEE' then
      update employee
      set
        type = p_organizational->>'type',
        division = p_organizational->>'division',
        title = p_organizational->>'title',
        contact_number = p_organizational->>'contact_number'
      where user_id = v_user_id;
    else
      delete from student where user_id = v_user_id;
      insert into employee (user_id, type, division, title, contact_number)
      values (
        v_user_id,
        p_organizational->>'type',
        p_organizational->>'division',
        p_organizational->>'title',
        p_organizational->>'contact_number'
      );
    end if;
  end if;

  if p_guardian is not null then
    insert into guardian (
      user_id, first_name, middle_name, last_name, sex, address, contact_number
    )
    values (
      v_user_id,
      p_guardian->>'first_name',
      p_guardian->>'middle_name',
      p_guardian->>'last_name',
      upper(p_guardian->>'sex'),
      p_guardian->>'address',
      p_guardian->>'contact_number'
    )
    on conflict (user_id) do update
      set first_name = excluded.first_name,
          middle_name = excluded.middle_name,
          last_name = excluded.last_name,
          sex = excluded.sex,
          address = excluded.address,
          contact_number = excluded.contact_number;
  else
    delete from guardian where user_id = v_user_id;
  end if;

end;
$$ language plpgsql security definer;
