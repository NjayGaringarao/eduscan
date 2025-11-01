"use server";

import { Slot } from "@/models";
import { createClient } from "@/utils/supabase/server";
import { createLog } from "../log";

export type UpdateScheduleInput = {
  id: string;
  name?: string;
  description?: string | null;
  slots?: Array<Omit<Slot, "id" | "schedule_id">>;
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

    // Handle slot updates: delete old slots and insert new ones
    if (input.slots !== undefined) {
      // Delete all existing slots for this schedule
      const { error: deleteErr } = await supabase
        .from("slot")
        .delete()
        .eq("schedule_id", input.id);
      if (deleteErr) return { error: deleteErr.message };

      // Insert new slots if any
      if (input.slots.length > 0) {
        const { error: slotError } = await supabase.from("slot").insert(
          input.slots.map((s) => ({
            schedule_id: input.id,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            label: s.label ?? null,
          }))
        );
        if (slotError) return { error: slotError.message };
      }
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
