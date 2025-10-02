"use server";

import { Slot } from "@/models";
import { createClient } from "@/utils/supabase/server";
import { createLog } from "../log";

export type NewScheduleInput = {
  name: string;
  user_type: "STUDENT" | "EMPLOYEE";
  description?: string | null;
  slots: Array<Omit<Slot, "slot_id" | "schedule_id">>;
};

export const createSchedule = async (
  input: NewScheduleInput
): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    const { data: created, error } = await supabase
      .from("schedule")
      .insert({
        name: input.name,
        description: input.description ?? null,
        user_type: input.user_type,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select(
        "schedule_id, name, description, user_type, is_active, created_at"
      )
      .single();

    if (error) return { error: error.message };

    const scheduleId = String(created.schedule_id);

    if (input.slots.length > 0) {
      const { error: slotError } = await supabase.from("slot").insert(
        input.slots.map((s) => ({
          schedule_id: scheduleId,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          label: s.label ?? null,
        }))
      );
      if (slotError) return { error: slotError.message };
    }

    await createLog({
      type: "ADMIN.OPERATION",
      title: "Schedule Created",
      description: `Schedule '${input.name}' created for ${input.user_type}.`,
    });

    return {};
  } catch (err: any) {
    return { error: err.message };
  }
};
