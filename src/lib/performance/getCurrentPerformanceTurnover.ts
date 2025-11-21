"use server";

import {
  CurrentPerformanceTurnover,
  PerformanceTurnoverSnapshot,
} from "@/types";
import { createClient } from "@/utils/supabase/server";

export const getCurrentPerformanceTurnover = async (): Promise<{
  data: CurrentPerformanceTurnover | null;
  error: string | null;
}> => {
  const supabase = await createClient();

  try {
    // Get the most recent snapshot for each user type
    const { data, error } = await supabase
      .from("daily_performance_snapshot")
      .select("*")
      .order("snapshot_date", { ascending: false })
      .limit(100); // Get enough records to find the most recent for each type

    if (error) {
      console.error("Error fetching current performance turnover:", error);
      return {
        data: null,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        data: {
          student: null,
          employee: null,
          all: null,
        },
        error: null,
      };
    }

    // Find most recent snapshot for each type
    const student = data.find(
      (s: PerformanceTurnoverSnapshot) => s.user_type === "STUDENT"
    ) as PerformanceTurnoverSnapshot | undefined;

    const employee = data.find(
      (s: PerformanceTurnoverSnapshot) => s.user_type === "EMPLOYEE"
    ) as PerformanceTurnoverSnapshot | undefined;

    const all = data.find(
      (s: PerformanceTurnoverSnapshot) => s.user_type === "ALL"
    ) as PerformanceTurnoverSnapshot | undefined;

    // Calculate trends if we have data
    const trends: CurrentPerformanceTurnover["trends"] = {};

    // Calculate day-over-day and week-over-week trends for each type
    for (const type of ["STUDENT", "EMPLOYEE", "ALL"] as const) {
      const current = type === "STUDENT" ? student : type === "EMPLOYEE" ? employee : all;
      if (!current) continue;

      // Get yesterday's snapshot
      const yesterday = new Date(current.snapshot_date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const { data: yesterdayData } = await supabase
        .from("daily_performance_snapshot")
        .select("attendance_rate")
        .eq("snapshot_date", yesterdayStr)
        .eq("user_type", type)
        .single();

      // Get last week's snapshot
      const lastWeek = new Date(current.snapshot_date);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString().split("T")[0];

      const { data: weekAgoData } = await supabase
        .from("daily_performance_snapshot")
        .select("attendance_rate")
        .eq("snapshot_date", lastWeekStr)
        .eq("user_type", type)
        .single();

      const dayOverDay =
        current.attendance_rate && yesterdayData?.attendance_rate
          ? current.attendance_rate - yesterdayData.attendance_rate
          : null;

      const weekOverWeek =
        current.attendance_rate && weekAgoData?.attendance_rate
          ? current.attendance_rate - weekAgoData.attendance_rate
          : null;

      trends[type.toLowerCase() as "student" | "employee" | "all"] = {
        dayOverDay,
        weekOverWeek,
      };
    }

    return {
      data: {
        student: student || null,
        employee: employee || null,
        all: all || null,
        trends: Object.keys(trends).length > 0 ? trends : undefined,
      },
      error: null,
    };
  } catch (err: any) {
    console.error("getCurrentPerformanceTurnover failed:", err);
    return {
      data: null,
      error: err.message || "Failed to fetch current performance turnover data",
    };
  }
};

