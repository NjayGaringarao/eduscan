"use server";

import { createClient } from "@/utils/supabase/server";
import { createLog } from "../log";

export const unlinkUsersFromSchedule = async (
  scheduleId: string,
  userIds: string[]
): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    // Set schedule_id to null for the specified users
    const { error } = await supabase
      .from("user")
      .update({ schedule_id: null })
      .in("user_id", userIds);

    if (error) return { error: error.message };

    await createLog({
      type: "ADMIN.OPERATION",
      title: "Users Unlinked from Schedule",
      description: `${userIds.length} user(s) unlinked from schedule '${scheduleId}'.`,
    });

    return {};
  } catch (err: any) {
    return { error: err.message };
  }
};
