"use server";

import { createClient } from "@/utils/supabase/server";
import SupabaseClient from "@supabase/supabase-js/dist/module/SupabaseClient";

interface ICreateUser {
  user: {
    name: string;
    sex: string;
    birth_date: string;
    address: string;
    contact_number: string;
  };
  organizational:
    | {
        user_id: string;
        role: "EMPLOYEE";
        type: string;
        division: string;
        position: string;
        contact_number: string;
      }
    | {
        user_id: string;
        role: "STUDENT";
        department: string;
        program: string;
      };
  guardian?: {
    name: string;
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
  const supabase = await createClient();

  try {
    // STEP 1: Insert into user
    const { error: userError } = await supabase.from("user").insert([
      {
        user_id: organizational.user_id,
        name: user.name,
        sex: user.sex,
        birth_date: user.birth_date,
        address: user.address,
        contact_number: user.contact_number,
        facial_encoding: facialEncoding,
      },
    ]);
    if (userError) throw new Error(userError.message);

    // STEP 2: Insert into employee or student based on role
    let organizationalData;
    if (organizational.role === "STUDENT") {
      organizationalData = await supabase.from("student").insert([
        {
          user_id: organizational.user_id,
          department: organizational.department,
          program: organizational.program,
        },
      ]);
    } else if (organizational.role === "EMPLOYEE") {
      organizationalData = await supabase.from("employee").insert([
        {
          user_id: organizational.user_id,
          type: organizational.type,
          division: organizational.division,
          position: organizational.position,
          contact_number: organizational.contact_number,
        },
      ]);
    }
    if (organizationalData?.error)
      throw new Error(organizationalData.error.message);

    // STEP 3: Insert into guardian
    if (guardian) {
      const { error: guardianError } = await supabase.from("guardian").insert([
        {
          user_id: organizational.user_id,
          name: guardian.name,
          sex: guardian.sex,
          address: guardian.address,
          contact_number: guardian.contact_number,
        },
      ]);

      if (guardianError) throw new Error(guardianError.message);
    }
  } catch (error) {
    await cleanFailedSetup(supabase, organizational.user_id);
    return { error: `USER CREATION FAILED: ${error}` };
  }

  console.log("lib.user.create :: Successfully created a user");
  return {};
};

const cleanFailedSetup = async (
  supabase: SupabaseClient<any, "public", "public", any, any>,
  user_id: string
) => {
  try {
    await supabase.from("user").delete().eq("user_id", user_id);
  } catch {
  } finally {
    console.log(
      "lib.user.create :: Clean Failed Setup is performed due to user creation error."
    );
  }
};
