"use server";

import { createClient } from "@/utils/supabase/server";
import type { SystemLog } from "@/models";
import type { LogType } from "@/types";

interface CreateLogParams {
  type: Exclude<LogType, "ALL" | "ATTENDANCE">;
  title: string;
  description: string;
}

export const createLog = async ({
  type,
  title,
  description,
}: CreateLogParams): Promise<{ log?: SystemLog; error?: string }> => {
  try {
    const supabase = await createClient();

    const payload: Record<string, unknown> = {
      type,
      title,
      description,
    };

    const { data, error } = await supabase
      .from("system_log")
      .insert(payload)
      .select("log_id, type, title, description")
      .single();

    if (error) {
      return { error: error.message };
    }

    return { log: data as SystemLog };
  } catch (err: any) {
    return { error: err.message ?? "Failed to create system log" };
  }
};
