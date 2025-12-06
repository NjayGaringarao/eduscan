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
  averagePunctualityLabel: string | null;
  averageTimeBalanceValue: number | null;
  averageTimeBalanceLabel: string | null;
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
    const { data, error } = await supabase.rpc(
      "get_at_risk_user_details",
      {
        p_date: date,
        p_role: role,
      }
    );

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
        averagePunctualityLabel: row.average_punctuality_label,
        averageTimeBalanceValue: row.average_time_balance_value,
        averageTimeBalanceLabel: row.average_time_balance_label,
        attendanceForecastProbability: row.attendance_forecast_probability,
        attendanceForecastConfidence: row.attendance_forecast_confidence,
      })) ?? [];

    return { data: mapped };
  } catch (err: any) {
    console.error("getAtRiskUserDetails failed", err);
    return { data: [], error: err.message ?? String(err) };
  }
};


