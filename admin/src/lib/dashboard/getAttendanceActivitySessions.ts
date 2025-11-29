"use server";

import { createClient } from "@/utils/supabase/server";
import { UserRole } from "./types";

export interface AttendanceActivitySession {
  userId: string;
  fullName: string;
  timeIn: string;
  timeOut: string;
  durationMinutes: number;
  role: UserRole | "UNKNOWN";
  titleProgram: string;
}

export interface AttendanceActivitySessionResult {
  sessions: AttendanceActivitySession[];
  error?: string;
}

export const getAttendanceActivitySessions = async ({
  date,
  role,
}: {
  date: string;
  role: UserRole;
}): Promise<AttendanceActivitySessionResult> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "get_attendance_activity_sessions",
      {
        p_date: date,
        p_role: role,
      }
    );

    if (error) {
      return { sessions: [], error: error.message };
    }

    const sessions =
      (data ?? []).map((row: any) => ({
        userId: row.user_id,
        fullName: row.full_name,
        timeIn: row.time_in,
        timeOut: row.time_out,
        durationMinutes: row.duration_minutes,
        role: row.role,
        titleProgram: row.title_program,
      })) ?? [];

    return { sessions };
  } catch (error: any) {
    console.error("getAttendanceActivitySessions failed", error);
    return { sessions: [], error: error.message ?? String(error) };
  }
};


