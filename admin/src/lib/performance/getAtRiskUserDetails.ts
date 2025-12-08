"use server";

import { createClient } from "@/utils/supabase/server";

export interface AtRiskUserDetail {
  userId: string;
  fullName: string;
  userRole: "STUDENT" | "EMPLOYEE" | "ALL" | "UNKNOWN";
  department?: string | null;
  division?: string | null;
  program?: string | null;
  title?: string | null;
  averagePunctualityValue: number | null;
  averageTimeBalanceValue: number | null;
  attendanceRateValue: number | null;
  attendanceForecastProbability: number | null;
  attendanceForecastConfidence: number | null;
}

export const getAtRiskUserDetails = async ({
  date,
  role,
}: {
  date: string;
  role: "ALL" | "STUDENT" | "EMPLOYEE";
}): Promise<{ data: AtRiskUserDetail[]; error?: string }> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_at_risk_user_details", {
      p_date: date,
      p_role: role,
    });

    if (error) {
      return { data: [], error: error.message };
    }

    const mapped =
      (data || []).map((row: any) => ({
        userId: row.user_id,
        fullName: row.full_name,
        userRole: (row.user_role || "UNKNOWN") as AtRiskUserDetail["userRole"],
        department: row.department,
        division: row.division,
        program: row.program,
        title: row.title,
        averagePunctualityValue: row.average_punctuality_value,
        averageTimeBalanceValue: row.average_time_balance_value,
        attendanceRateValue: row.attendance_rate_value,
        attendanceForecastProbability: row.attendance_forecast_probability,
        attendanceForecastConfidence: row.attendance_forecast_confidence,
      })) ?? [];

    return { data: mapped };
  } catch (err: any) {
    console.error("getAtRiskUserDetails failed", err);
    return { data: [], error: err.message ?? String(err) };
  }
};
