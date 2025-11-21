"use server";

import { PerformanceTurnoverSnapshot } from "@/types";
import { createClient } from "@/utils/supabase/server";

export const getPerformanceSnapshotByDate = async (
  date: string,
  userType: "STUDENT" | "EMPLOYEE" | "ALL"
): Promise<{
  data: PerformanceTurnoverSnapshot | null;
  error: string | null;
}> => {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("daily_performance_snapshot")
      .select("*")
      .eq("snapshot_date", date)
      .eq("user_type", userType)
      .single();

    if (error) {
      // If no data found, return null (not an error)
      if (error.code === "PGRST116") {
        return {
          data: null,
          error: null,
        };
      }
      console.error("Error fetching performance snapshot:", error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as PerformanceTurnoverSnapshot,
      error: null,
    };
  } catch (err: any) {
    console.error("getPerformanceSnapshotByDate failed:", err);
    return {
      data: null,
      error: err.message || "Failed to fetch performance snapshot",
    };
  }
};

