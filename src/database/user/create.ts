"use server";

import { createClient } from "@/utils/supabase/server";

interface ICreateUser {
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

export const create = async ({
  user,
  organizational,
  guardian,
  facialEncoding,
}: ICreateUser): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc("create_user", {
      p_user: user,
      p_organizational: organizational,
      p_guardian: guardian ?? null,
      p_facial_encoding: facialEncoding,
    });

    if (error) throw new Error(error.message);

    console.log("lib.user.create :: Successfully created a user");
    return {};
  } catch (error) {
    return { error: `USER CREATION FAILED: ${error}` };
  }
};

/**
 
-- Database function 'create_user':

create or replace function create_user_all(
  p_user jsonb,
  p_organizational jsonb,
  p_guardian jsonb,
  p_facial_encoding double precision[]
) returns void as $$
begin
  -- Lock for transaction safety (optional)
  perform pg_advisory_xact_lock(2);

  -- Step 1: Insert into user
  insert into "user" (
    user_id,
    first_name,
    middle_name,
    last_name,
    sex,
    birth_date,
    address,
    facial_encoding
  )
  values (
    p_organizational->>'user_id',
    p_user->>'first_name',
    p_user->>'middle_name',
    p_user->>'last_name',
    p_user->>'sex',
    (p_user->>'birth_date')::date,
    p_user->>'address',
    p_facial_encoding
  );

  -- Step 2: Insert organizational
  if (p_organizational->>'role') = 'STUDENT' then
    insert into student (user_id, department, program)
    values (
      p_organizational->>'user_id',
      p_organizational->>'department',
      p_organizational->>'program'
    );
  elsif (p_organizational->>'role') = 'EMPLOYEE' then
    insert into employee (user_id, type, division, title, contact_number)
    values (
      p_organizational->>'user_id',
      p_organizational->>'type',
      p_organizational->>'division',
      p_organizational->>'title',
      p_organizational->>'contact_number'
    );
  end if;

  -- Step 3: Insert guardian if provided
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
    );
  end if;

end;
$$ language plpgsql;

*/
