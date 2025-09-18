"use server";

import { SystemLog } from "@/models";
import { createClient } from "@/utils/supabase/server";

interface GetSystemLogsParams {
  fromDate: string;
  toDate: string;
  type?: string;
}

export const getSystemLogs = async ({
  fromDate,
  toDate,
  type,
}: GetSystemLogsParams): Promise<{
  logs: SystemLog[];
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("system_log")
      .select("log_id, timestamp, type, title, description")
      .gte("timestamp", fromDate)
      .lte("timestamp", toDate)
      .order("timestamp", { ascending: false });

    if (type && type !== "ALL") {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      return { logs: [], error: error.message };
    }

    return { logs: data as SystemLog[] };
  } catch (err: any) {
    return { logs: [], error: err.message };
  }
};
