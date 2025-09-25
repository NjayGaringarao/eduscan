"use server";

import { createClient } from "@/utils/supabase/server";
import { createLog } from "../log";

export type UpdateScheduleInput = {
  schedule_id: string;
  name?: string;
  description?: string | null;
  user_type?: "STUDENT" | "EMPLOYEE";
};

export const updateSchedule = async (
  input: UpdateScheduleInput
): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    if (
      input.name !== undefined ||
      input.description !== undefined ||
      input.user_type !== undefined
    ) {
      const { error: updErr } = await supabase
        .from("schedule")
        .update({
          name: input.name,
          description: input.description ?? null,
          user_type: input.user_type,
        })
        .eq("schedule_id", input.schedule_id);
      if (updErr) return { error: updErr.message };
    }

    await createLog({
      type: "ADMIN.OPERATION",
      title: "Schedule Updated",
      description: `Schedule '${input.schedule_id}' was updated.`,
    });

    return {};
  } catch (err: any) {
    return { error: err.message };
  }
};
