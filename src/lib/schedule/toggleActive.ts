"use server";

import { createClient } from "@/utils/supabase/server";

export const toggleScheduleActive = async (
  scheduleId: string,
  isActive: boolean
): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("schedule")
      .update({ is_active: isActive })
      .eq("schedule_id", scheduleId);
    if (error) return { error: error.message };
    return {};
  } catch (err: any) {
    return { error: err.message };
  }
};
