"use server";

import { createClient } from "@/utils/supabase/server";
import { createLog } from "../log";

export const deleteSchedule = async (
  scheduleId: string
): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    // First, unlink all users from this schedule using the shared RPC function
    const { data: unlinkData, error: unlinkError } = await supabase.rpc(
      "unlink_user_schedule",
      {
        p_schedule_id: parseInt(scheduleId),
        p_user_ids: null, // null means unlink all users from this schedule
      }
    );

    if (unlinkError) return { error: unlinkError.message };

    // Then deactivate the schedule
    const { error: scheduleError } = await supabase
      .from("schedule")
      .update({ is_active: false })
      .eq("id", scheduleId);

    if (scheduleError) return { error: scheduleError.message };

    // Create log entry with the count of unlinked users returned from RPC
    const unlinkedCount = unlinkData?.[0]?.unlinked_users_count || 0;
    await createLog({
      type: "ADMIN.OPERATION",
      title: "Schedule Deleted",
      description: `Schedule '${scheduleId}' deactivated and ${unlinkedCount} user(s) unlinked (data preserved for analysis).`,
    });

    return {};
  } catch (err: any) {
    return { error: err.message };
  }
};
