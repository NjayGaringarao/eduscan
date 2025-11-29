"use server";

// export type AttendancePeriod = "04:00-19:00" | "00:00-23:59";
// export type AttendanceChartGranule = "1 hour" | "30 minutes" | "15 minutes";
// export type UserRole = "ALL" | "STUDENT" | "EMPLOYEE";

import { createClient } from "@/utils/supabase/server";
import { AttendanceChartInterval, AttendancePoint, UserRole } from "./types";

export interface IAttendanceActivityFilter {
  fromDate: string;
  toDate: string;
  role: UserRole;
  interval: AttendanceChartInterval;
}

interface AttendanceTrend {
  data: AttendancePoint[];
  error?: string;
}

export const getAttendanceActivity = async ({
  fromDate,
  toDate,
  role,
  interval,
}: IAttendanceActivityFilter): Promise<AttendanceTrend> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_attendance_trend_range", {
      p_from_date: new Date(fromDate).toISOString(),
      p_to_date: new Date(toDate).toISOString(),
      p_role: role,
      p_interval: interval,
    });

    if (error) {
      return { data: [], error: error.message };
    } else {
      return { data };
    }
  } catch (error) {
    console.log(`lib.dashboard.attendanceTrend.getRangeTrend :: ${error}`);
    return { data: [], error: `Failed to fetch data: ${error}` };
  }
};
