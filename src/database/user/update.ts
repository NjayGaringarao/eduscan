"use server";

import { createLog } from "@/lib/log";
import { createClient } from "@/utils/supabase/server";

interface IUpdateUser {
  user: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    sex: string;
    birth_date: string;
    address: string;
  };
  organizational:
    | {
        user_id: string;
        role: "EMPLOYEE";
        type: string;
        division: string;
        title: string;
        contact_number: string;
      }
    | {
        user_id: string;
        role: "STUDENT";
        department: string;
        program: string;
      };
  guardian?: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    sex: string;
    address: string;
    contact_number: string;
  };
  facialEncoding: number[] | null;
}

export const update = async ({
  user,
  organizational,
  guardian,
  facialEncoding,
}: IUpdateUser): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc("update_user", {
      p_user: { id: organizational.user_id, ...user },
      p_organizational: organizational,
      p_guardian: guardian ?? null,
      p_facial_encoding: facialEncoding,
    });

    if (error) throw new Error(error.message);

    await createLog({
      type: "ADMIN.DATA",
      title: `User's (id: ${organizational.user_id}) Information is Updated`,
      description: `A user with the following attribute is updated: [name: '${user.first_name} ${user.last_name}'], [role: ${organizational.role}], [user-id: ${organizational.user_id}].`,
    });
    return {};
  } catch (error) {
    return { error: `USER UPDATE FAILED: ${error}` };
  }
};

/**
 
-- Database function 'update_user':

declare
  v_role text;
begin
  -- Start transaction
  perform pg_advisory_xact_lock(1);

  -- Update user table
  update "user"
  set
    first_name = p_user->>'first_name',
    middle_name = p_user->>'middle_name',
    last_name = p_user->>'last_name',
    sex = p_user->>'sex',
    birth_date = (p_user->>'birth_date')::date,
    address = p_user->>'address',
    facial_encoding = p_facial_encoding
  where user_id = p_organizational->>'user_id';

  -- Detect current role
  if exists(select 1 from student where user_id = p_organizational->>'user_id') then
    v_role := 'STUDENT';
  elsif exists(select 1 from employee where user_id = p_organizational->>'user_id') then
    v_role := 'EMPLOYEE';
  else
    v_role := null;
  end if;

  -- Handle organizational role
  if (p_organizational->>'role') = 'STUDENT' then
    if v_role = 'STUDENT' then
      update student
      set department = p_organizational->>'department',
          program = p_organizational->>'program'
      where user_id = p_organizational->>'user_id';
    else
      delete from employee where user_id = p_organizational->>'user_id';
      insert into student (user_id, department, program)
      values (p_organizational->>'user_id',
              p_organizational->>'department',
              p_organizational->>'program');
    end if;
  elsif (p_organizational->>'role') = 'EMPLOYEE' then
    if v_role = 'EMPLOYEE' then
      update employee
      set type = p_organizational->>'type',
          division = p_organizational->>'division',
          title = p_organizational->>'title',
          contact_number = p_organizational->>'contact_number'
      where user_id = p_organizational->>'user_id';
    else
      delete from student where user_id = p_organizational->>'user_id';
      insert into employee (user_id, type, division, title, contact_number)
      values (p_organizational->>'user_id',
              p_organizational->>'type',
              p_organizational->>'division',
              p_organizational->>'title',
              p_organizational->>'contact_number');
    end if;
  end if;

  -- Guardian
  if p_guardian is not null then
    insert into guardian (user_id, first_name, middle_name, last_name, sex, address, contact_number)
    values (
      p_organizational->>'user_id',
      p_guardian->>'first_name',
      p_guardian->>'middle_name',
      p_guardian->>'last_name',
      p_guardian->>'sex',
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
    delete from guardian where user_id = p_organizational->>'user_id';
  end if;

end;

*/
