"use server";

import { createClient } from "@/utils/supabase/server";
import { User } from "@/models";

export interface AtRiskUser extends User {
  user_type: "STUDENT" | "EMPLOYEE";
  average_punctuality_value: number | null;
  average_punctuality_label: string | null;
  average_time_balance_value: number | null;
  average_time_balance_label: string | null;
  attendance_rate_value: number | null;
  attendance_rate_label: string | null;
  dropout_risk_level: "AT_RISK" | "NOT_AT_RISK" | "No Data";
  dropout_risk_percentage: number | null;
  dropout_risk_confidence: number | null;
}

export const getAtRiskUsers = async (
  date: string,
  userType: "STUDENT" | "EMPLOYEE" | "ALL"
): Promise<{
  data: AtRiskUser[] | null;
  error: string | null;
}> => {
  const supabase = await createClient();

  try {
    // Convert date string to date range for created_at filtering
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    let query = supabase
      .from("daily_user_performance")
      .select(
        `
        user_type,
        average_punctuality_value,
        average_punctuality_label,
        average_time_balance_value,
        average_time_balance_label,
        attendance_rate_value,
        attendance_rate_label,
        dropout_risk_level,
        dropout_risk_percentage,
        dropout_risk_confidence,
        user:user_id (
          id,
          first_name,
          middle_name,
          last_name,
          picture_id,
          schedule_id
        )
      `
      )
      .gte("created_at", dateStart.toISOString())
      .lte("created_at", dateEnd.toISOString())
      .eq("dropout_risk_level", "AT_RISK")
      .order("dropout_risk_percentage", { ascending: false });

    // Filter by user type if not ALL
    if (userType !== "ALL") {
      query = query.eq("user_type", userType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching at-risk users:", error);
      return {
        data: null,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    // Transform the data to match AtRiskUser interface
    // Fetch student/employee data separately for users
    const userIds = data
      .map((row: any) => row.user_id || row.user?.id)
      .filter(Boolean);

    // Fetch student and employee data
    const { data: students } = await supabase
      .from("student")
      .select("user_id, department, program")
      .in("user_id", userIds);

    const { data: employees } = await supabase
      .from("employee")
      .select("user_id, type, division, title, contact_number")
      .in("user_id", userIds);

    // Create maps for quick lookup
    const studentMap = new Map(
      (students || []).map((s: any) => [s.user_id, s])
    );
    const employeeMap = new Map(
      (employees || []).map((e: any) => [e.user_id, e])
    );

    const atRiskUsers: AtRiskUser[] = data.map((row: any) => {
      const user = row.user || {};
      const userId = user.id || row.user_id;

      return {
        id: userId,
        first_name: user.first_name || "",
        middle_name: user.middle_name,
        last_name: user.last_name || "",
        picture_id: user.picture_id,
        schedule_id: user.schedule_id,
        student: studentMap.get(userId) || null,
        employee: employeeMap.get(userId) || null,
        user_type: row.user_type as "STUDENT" | "EMPLOYEE",
        average_punctuality_value: row.average_punctuality_value,
        average_punctuality_label: row.average_punctuality_label,
        average_time_balance_value: row.average_time_balance_value,
        average_time_balance_label: row.average_time_balance_label,
        attendance_rate_value: row.attendance_rate_value,
        attendance_rate_label: row.attendance_rate_label,
        dropout_risk_level: row.dropout_risk_level,
        dropout_risk_percentage: row.dropout_risk_percentage,
        dropout_risk_confidence: row.dropout_risk_confidence,
      };
    });

    return {
      data: atRiskUsers,
      error: null,
    };
  } catch (err: any) {
    console.error("getAtRiskUsers failed:", err);
    return {
      data: null,
      error: err.message || "Failed to fetch at-risk users",
    };
  }
};
