"use server";

import { createClient } from "@/utils/supabase/server";
import { createLog } from "../log";

export const deleteSchedule = async (
  scheduleId: string
): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    // First delete slots due to FK
    const { error: slotErr } = await supabase
      .from("slot")
      .delete()
      .eq("schedule_id", scheduleId);
    if (slotErr) return { error: slotErr.message };

    const { error } = await supabase
      .from("schedule")
      .delete()
      .eq("schedule_id", scheduleId);
    if (error) return { error: error.message };

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
