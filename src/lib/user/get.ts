"use server";

import { ExtendedUser } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const get = async (
  user_id: string
): Promise<{ user: ExtendedUser | null; error?: string }> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_user", {
      p_user_id: user_id,
    });

    if (error) throw new Error(error.message);

    const userData = Array.isArray(data) ? data[0] : null;
    if (!userData) return { user: null };

    return {
      user: {
        id: userData.id,
        first_name: userData.first_name,
        middle_name: userData.middle_name,
        last_name: userData.last_name,
        sex: userData.sex,
        birth_date: userData.birth_date,
        picture_id: userData.picture_id,
        address: userData.address ?? undefined,
        schedule_id: userData.schedule_id ?? undefined,
        student: userData.student,
        guardian: userData.guardian,
        employee: userData.employee,
        has_facial_encoding: userData.has_facial_encoding,
      },
    };
  } catch (error) {
    return { user: null, error: `FAILED TO GET USER INFORMATION: ${error}` };
  }
};
