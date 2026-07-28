"use server";

import { createClient } from "@/utils/supabase/server";
import type { SystemLog } from "@/models";
import type { LogType } from "@/types";

interface CreateLogParams {
  type: Exclude<LogType, "ALL" | "ATTENDANCE">;
  title: string;
  description: string;
  reference_id?: number;
}

export const createLog = async ({
  type,
  title,
  description,
  reference_id,
}: CreateLogParams): Promise<{ log?: SystemLog; error?: string }> => {
  try {
    const supabase = await createClient();

    const payload: Record<string, unknown> = {
      type,
      title,
      description,
      reference_id,
    };

    const { data, error } = await supabase
      .from("system_log")
      .insert(payload)
      .select("id, type, title, description, reference_id")
      .single();

    if (error) {
      return { error: error.message };
    }

    return { log: data as SystemLog };
  } catch (err: any) {
    return { error: err.message ?? "Failed to create system log" };
  }
};
