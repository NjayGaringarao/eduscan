"use server";

import { SystemLog } from "@/models";
import { createClient } from "@/utils/supabase/server";

interface IGetLogs {
  fromDate: string;
  toDate: string;
  logType: string;
}

export const getLogs = async ({
  fromDate,
  toDate,
  logType,
}: IGetLogs): Promise<{
  logs: SystemLog[];
  error?: string;
}> => {
  try {
    console.log(toDate);
    const supabase = await createClient();

    // To include all logs on the toDate, add 1 day to toDate and use .lt (less than) instead of .lte (less than or equal)
    // This way, all timestamps before the next day (exclusive) are included
    const toDateObj = new Date(toDate);
    toDateObj.setDate(toDateObj.getDate() + 1);
    const toDatePlusOne = toDateObj.toISOString().split("T")[0];

    let query = supabase
      .from("system_log")
      .select("log_id, timestamp, type, title, description")
      .gte("timestamp", fromDate)
      .lt("timestamp", toDatePlusOne)
      .order("timestamp", { ascending: false })
      .range(0, 100000);

    if (logType && logType !== "ALL") {
      query = query.eq("type", logType);
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
