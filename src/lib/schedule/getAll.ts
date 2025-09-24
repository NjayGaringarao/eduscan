"use server";

import { Schedule } from "@/models";
import { createClient } from "@/utils/supabase/server";

export type ScheduleListItem = Schedule & {
  slots_count: number;
};

export const getAllSchedules = async (): Promise<{
  schedules: ScheduleListItem[];
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data: schedules, error } = await supabase
      .from("schedule")
      .select(
        "schedule_id, name, description, user_type, is_active, created_at, schedule_slot(count)"
      )
      .order("created_at", { ascending: false });

    if (error) return { schedules: [], error: error.message };

    const normalized: ScheduleListItem[] = (schedules ?? []).map((s: any) => ({
      schedule_id: String(s.schedule_id),
      name: s.name,
      description: s.description ?? null,
      user_type: s.user_type,
      is_active: Boolean(s.is_active ?? true),
      created_at: s.created_at ?? new Date().toISOString(),
      slots_count: (s.schedule_slot?.[0]?.count as number) ?? 0,
    }));

    return { schedules: normalized };
  } catch (err: any) {
    return { schedules: [], error: err.message };
  }
};
