"use server";

import { ScheduleSlot } from "@/models";
import { createClient } from "@/utils/supabase/server";
import { createLog } from "../log";

export type UpdateScheduleInput = {
  schedule_id: string;
  name?: string;
  description?: string | null;
  user_type?: "STUDENT" | "EMPLOYEE";
  // Full replace of slots
  slots?: Array<
    | (Omit<ScheduleSlot, "schedule_id"> & { _op?: "upsert" | "delete" })
    | ({ slot_id?: string } & Omit<ScheduleSlot, "slot_id" | "schedule_id"> & {
          _op?: "upsert" | "delete";
        })
  >;
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

    if (input.slots) {
      const toDelete = input.slots.filter(
        (s: any) => s._op === "delete" && s.slot_id
      );
      if (toDelete.length > 0) {
        const ids = toDelete.map((s: any) => s.slot_id);
        const { error: delErr } = await supabase
          .from("schedule_slot")
          .delete()
          .in("slot_id", ids);
        if (delErr) return { error: delErr.message };
      }

      const toUpsert = input.slots.filter((s: any) => s._op !== "delete");
      if (toUpsert.length > 0) {
        const payload = toUpsert.map((s: any) => ({
          slot_id: s.slot_id,
          schedule_id: input.schedule_id,
          day_of_week: s.day_of_week,
          end_day_of_week: s.end_day_of_week ?? s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          label: s.label ?? null,
        }));

        const { error: upsertErr } = await supabase
          .from("schedule_slot")
          .upsert(payload, {
            onConflict: "slot_id",
            ignoreDuplicates: false,
          });
        if (upsertErr) return { error: upsertErr.message };
      }
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
