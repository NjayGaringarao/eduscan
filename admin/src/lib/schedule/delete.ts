"use server";

import { createClient } from "@/utils/supabase/server";
import { createLog } from "../log";

export const deleteSchedule = async (
  scheduleId: string
): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    // delete the schedule
    const { error: scheduleError } = await supabase
      .from("schedule")
      .delete()
      .eq("id", scheduleId);

    if (scheduleError) return { error: scheduleError.message };

    await createLog({
      type: "ADMIN.OPERATION",
      title: "Schedule Deleted",
      description: `Schedule '${scheduleId}' deleted.`,
    });

    return {};
  } catch (err: any) {
    return { error: err.message };
  }
};
