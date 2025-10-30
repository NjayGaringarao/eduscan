"use server";

import { createClient } from "@/utils/supabase/server";
import { createLog } from "../log";

export type UpdateScheduleInput = {
  id: string;
  name?: string;
  description?: string | null;
};

export const updateSchedule = async (
  input: UpdateScheduleInput
): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    if (input.name !== undefined || input.description !== undefined) {
      const { error: updErr } = await supabase
        .from("schedule")
        .update({
          name: input.name,
          description: input.description ?? null,
        })
        .eq("id", input.id);
      if (updErr) return { error: updErr.message };
    }

    await createLog({
      type: "ADMIN.OPERATION",
      title: "Schedule Updated",
      description: `Schedule '${input.id}' was updated.`,
    });

    return {};
  } catch (err: any) {
    return { error: err.message };
  }
};
