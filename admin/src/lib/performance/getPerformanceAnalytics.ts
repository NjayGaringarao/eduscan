"use server";

import { PerformanceMetrics } from "@/types";
import { createClient } from "@/utils/supabase/server";

export const getPerformanceAnalytics = async (
  user_id: string
): Promise<{
  metrics: PerformanceMetrics | null;
  error: string | null;
}> => {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.functions.invoke(
      "performance_analytics",
      {
        body: { user_id },
      }
    );

    if (error) {
      console.error("Supabase function error: ", error);
      return {
        metrics: null,
        error: "Analytics Failed: " + error.message,
      };
    }

    // Handle if data is a string (double-encoded JSON)
    let parsedData = data;
    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse analytics data:", e);
        return {
          metrics: null,
          error: "Invalid JSON format received",
        };
      }
    }

    // Check if data has the expected structure
    if (!parsedData || typeof parsedData !== "object") {
      console.error("Invalid analytics data structure:", parsedData);
      return {
        metrics: null,
        error: "Invalid data format received from analytics service",
      };
    }

    // Verify required fields exist (updated for new structure)
    if (
      !parsedData.averagePunctuality ||
      !parsedData.averageTimeBalance ||
      !parsedData.attendanceForecast
    ) {
      console.error(
        "Missing required fields in analytics data:",
        Object.keys(parsedData)
      );
      return {
        metrics: null,
        error: "Analytics data missing required fields",
      };
    }

    return {
      metrics: parsedData as PerformanceMetrics,
      error: null,
    };
  } catch (err: any) {
    console.error("getPerformanceAnalytics failed:", err);
    return {
      metrics: null,
      error: "Analytics Failed: " + (err.message ?? "Unknown error"),
    };
  }
};
