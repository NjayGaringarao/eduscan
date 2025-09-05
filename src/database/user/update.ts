"use server";

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
    // Step 1: Update user
    const { error: userError } = await supabase
      .from("user")
      .update({
        user_id: organizational.user_id,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        sex: user.sex,
        birth_date: user.birth_date,
        address: user.address,
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
          title: organizational.title,
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
          user_id: organizational.user_id,
          first_name: guardian.first_name,
          middle_name: guardian.middle_name,
          last_name: guardian.last_name,
          sex: guardian.sex,
          address: guardian.address,
          contact_number: guardian.contact_number,
        })
        .eq("user_id", organizational.user_id);
      if (guardianError) throw new Error(guardianError.message);
    }

    // Step 3: Delete row from irrelevant table:
    if (organizational.role === "STUDENT") {
      try {
        await supabase
          .from("employee")
          .delete()
          .eq("user_id", organizational.user_id);
      } catch (error) {
        console.error(`database.user.update :: ${error}`);
      }
    } else {
      try {
        await supabase
          .from("student")
          .delete()
          .eq("user_id", organizational.user_id);
      } catch (error) {
        console.error(`database.user.update :: ${error}`);
      }
      try {
        await supabase
          .from("guardian")
          .delete()
          .eq("user_id", organizational.user_id);
      } catch (error) {
        console.error(`database.user.update :: ${error}`);
      }
    }
  } catch (error) {
    return { error: `USER UPDATE FAILED: ${error}` };
  }
  console.log("lib.user.update :: Successfully updated a user");
  return {};
};
