"use server";

import { ExtendedSchedule } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const getById = async (
  schedule_id: string
): Promise<{
  schedule: ExtendedSchedule | null;
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_schedule", {
      p_schedule_id: schedule_id,
    });

    if (error) {
      return { schedule: null, error: error.message };
    }

    // Since only one schedule is expected, take the first item
    return { schedule: data?.[0] ?? null };
  } catch (error) {
    console.log(`lib.schedule.get.getById :: ${error}`);
    return { schedule: null, error: `Failed to fetch data: ${error}` };
  }
};

export const getAll = async (): Promise<{
  schedules: ExtendedSchedule[];
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_schedule_v2");

    if (error) {
      return { schedules: [], error: error.message };
    }

    return { schedules: data ?? [] };
  } catch (error) {
    console.log(`lib.schedule.get.getAll :: ${error}`);
    return { schedules: [], error: `Failed to fetch data: ${error}` };
  }
};
