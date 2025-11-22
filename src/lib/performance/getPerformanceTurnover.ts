"use server";

import { PerformanceTurnoverSnapshot, PerformanceTurnoverTimeSeries } from "@/types";
import { createClient } from "@/utils/supabase/server";

export const getPerformanceTurnover = async (
  fromDate?: string,
  toDate?: string,
  userType?: "STUDENT" | "EMPLOYEE" | "ALL"
): Promise<{
  data: PerformanceTurnoverTimeSeries[] | null;
  error: string | null;
}> => {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("daily_performance_snapshot")
      .select("*")
      .order("created_at", { ascending: true });

    if (fromDate) {
      const fromDateStart = new Date(fromDate);
      fromDateStart.setHours(0, 0, 0, 0);
      query = query.gte("created_at", fromDateStart.toISOString());
    }

    if (toDate) {
      const toDateEnd = new Date(toDate);
      toDateEnd.setHours(23, 59, 59, 999);
      query = query.lte("created_at", toDateEnd.toISOString());
    }

    if (userType) {
      query = query.eq("user_type", userType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching performance turnover:", error);
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

    // Group by date and user type
    const groupedByDate = new Map<string, Map<string, PerformanceTurnoverSnapshot>>();

    for (const snapshot of data as PerformanceTurnoverSnapshot[]) {
      // Extract date from created_at
      const date = new Date(snapshot.created_at).toISOString().split('T')[0];
      if (!groupedByDate.has(date)) {
        groupedByDate.set(date, new Map());
      }
      groupedByDate.get(date)!.set(snapshot.user_type, snapshot);
    }

    // Convert to time series format
    const timeSeries: PerformanceTurnoverTimeSeries[] = Array.from(
      groupedByDate.entries()
    ).map(([date, snapshots]) => ({
      date,
      student: snapshots.get("STUDENT") || undefined,
      employee: snapshots.get("EMPLOYEE") || undefined,
      all: snapshots.get("ALL") || undefined,
    }));

    return {
      data: timeSeries,
      error: null,
    };
  } catch (err: any) {
    console.error("getPerformanceTurnover failed:", err);
    return {
      data: null,
      error: err.message || "Failed to fetch performance turnover data",
    };
  }
};

