"use server";

import { Schedule, ScheduleSlot } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const getScheduleById = async (
  scheduleId: string
): Promise<{
  schedule: Schedule | null;
  slots: ScheduleSlot[];
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data: scheduleData, error: scheduleError } = await supabase
      .from("schedule")
      .select(
        "schedule_id, name, description, user_type, is_active, created_at"
      )
      .eq("schedule_id", scheduleId)
      .single();

    if (scheduleError)
      return { schedule: null, slots: [], error: scheduleError.message };

    const schedule: Schedule = {
      schedule_id: String(scheduleData.schedule_id),
      name: scheduleData.name,
      description: scheduleData.description ?? null,
      user_type: scheduleData.user_type,
      is_active: Boolean(scheduleData.is_active ?? true),
      created_at: scheduleData.created_at ?? new Date().toISOString(),
    };

    const { data: slotsData, error: slotsError } = await supabase
      .from("schedule_slot")
      .select(
        "slot_id, schedule_id, day_of_week, end_day_of_week, start_time, end_time, label"
      )
      .eq("schedule_id", scheduleId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (slotsError) return { schedule, slots: [], error: slotsError.message };

    const slots: ScheduleSlot[] = (slotsData ?? []).map((s: any) => ({
      slot_id: String(s.slot_id),
      schedule_id: String(s.schedule_id),
      day_of_week: Number(s.day_of_week),
      end_day_of_week: Number(s.end_day_of_week ?? s.day_of_week),
      start_time: s.start_time,
      end_time: s.end_time,
      label: s.label ?? null,
    }));

    return { schedule, slots };
  } catch (err: any) {
    return { schedule: null, slots: [], error: err.message };
  }
};
