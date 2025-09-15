"use server";

import { AttendanceLog } from "@/models";
import { createClient } from "@/utils/supabase/server";

interface GetAttendanceLogsParams {
  fromDate: string;
  toDate: string;
}

export const getAttendanceLogs = async ({
  fromDate,
  toDate,
}: GetAttendanceLogsParams): Promise<{
  logs: AttendanceLog[];
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("attendance_log")
      .select("log_id, user_id, timestamp, action")
      .gte("timestamp", fromDate)
      .lte("timestamp", toDate)
      .order("timestamp", { ascending: false });

    if (error) {
      return { logs: [], error: error.message };
    }

    return { logs: data as AttendanceLog[] };
  } catch (err: any) {
    return { logs: [], error: err.message };
  }
};
