"use server";

import { createLog } from "@/lib/log";
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
      p_user: { id: organizational.user_id, ...user },
      p_organizational: organizational,
      p_guardian: guardian ?? null,
      p_facial_encoding: facialEncoding,
    });

    if (error) throw new Error(error.message);

    await createLog({
      type: "ADMIN.DATA",
      title: `New User (id: ${organizational.user_id}) is Created`,
      description: `A user with the following attribute is created: [name: '${user.first_name} ${user.last_name}'], [role: ${organizational.role}], [user-id: ${organizational.user_id}].`,
    });

    return {};
  } catch (error) {
    return { error: `USER CREATION FAILED: ${error}` };
  }
};

/**
 
-- Database function 'create_user':
-- See: supabase/migrations/20250108000001_rpc_create_user.sql

*/
