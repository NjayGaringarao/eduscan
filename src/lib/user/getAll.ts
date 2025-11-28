"use server";

import { User } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const getAll = async (
  userType?: string
): Promise<{ users: User[]; error?: string }> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_users", {
      p_user_type: userType && userType !== "ALL" ? userType : "ALL",
    });

    if (error) throw new Error(error.message);

    const users: User[] = [];
    (data ?? []).forEach((user: any) => {
      const _user: User = {
        id: user.id,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        picture_id: user.picture_id,
        student: user.student,
        employee: user.employee,
        schedule_id: user.schedule_id,
        has_facial_encoding: user.has_facial_encoding,
      };
      users.push(_user);
    });

    return { users };
  } catch (error) {
    return { users: [], error: `FAILED TO GET USER INFORMATION: ${error}` };
  }
};
