"use server";

import { createClient } from "@/utils/supabase/server";

interface IUpdateUser {
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

export const update = async ({
  user,
  organizational,
  guardian,
  facialEncoding,
}: IUpdateUser): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();
    // Step 1: Update user
    const { error: userError } = await supabase
      .from("user")
      .update({
        name: user.name,
        sex: user.sex,
        birth_date: user.birth_date,
        address: user.address,
        contact_number: user.contact_number,
        facial_encoding: facialEncoding,
      })
      .eq("user_id", organizational.user_id);

    if (userError) throw new Error(userError.message);

    // Step 2: Update organizational data
    let organizationalData;
    if (organizational.role === "STUDENT") {
      organizationalData = await supabase
        .from("student")
        .update({
          department: organizational.department,
          program: organizational.program,
        })
        .eq("user_id", organizational.user_id);
    } else if (organizational.role === "EMPLOYEE") {
      organizationalData = await supabase
        .from("employee")
        .update({
          type: organizational.type,
          division: organizational.division,
          position: organizational.position,
          contact_number: organizational.contact_number,
        })
        .eq("user_id", organizational.user_id);
    }

    if (organizationalData?.error)
      throw new Error(organizationalData.error.message);

    // Step 3: Update guardian
    if (guardian) {
      const { error: guardianError } = await supabase
        .from("guardian")
        .update({
          name: guardian.name,
          sex: guardian.sex,
          address: guardian.address,
          contact_number: guardian.contact_number,
        })
        .eq("user_id", organizational.user_id);
      if (guardianError) throw new Error(guardianError.message);
    }
  } catch (error) {
    return { error: `USER UPDATE FAILED: ${error}` };
  }
  console.log("lib.user.update :: Successfully updated a user");
  return {};
};
