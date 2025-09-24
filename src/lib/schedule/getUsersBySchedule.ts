"use server";

import { User } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const getUsersBySchedule = async (
  scheduleId: string
): Promise<{ users: User[]; error?: string }> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user")
      .select(
        "user_id, first_name, last_name, middle_name, birth_date, address, picture_id, sex, schedule_id, facial_encoding"
      )
      .eq("schedule_id", scheduleId);

    if (error) return { users: [], error: error.message };

    return { users: (data ?? []) as unknown as User[] };
  } catch (err: any) {
    return { users: [], error: err.message };
  }
};
