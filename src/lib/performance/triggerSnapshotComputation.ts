"use server";

import { createClient } from "@/utils/supabase/server";

export const triggerSnapshotComputation = async (
  date: string
): Promise<{
  success: boolean;
  error: string | null;
}> => {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.functions.invoke(
      "compute_daily_snapshot",
      {
        body: {
          target_date: date,
        },
      }
    );

    if (error) {
      console.error("Error triggering snapshot computation:", error);
      return {
        success: false,
        error: error.message || "Failed to trigger snapshot computation",
      };
    }

    // Handle if data is a string (double-encoded JSON)
    let parsedData = data;
    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse response:", e);
        return {
          success: false,
          error: "Invalid response format",
        };
      }
    }

    if (parsedData?.error) {
      return {
        success: false,
        error: parsedData.error,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err: any) {
    console.error("triggerSnapshotComputation failed:", err);
    return {
      success: false,
      error: err.message || "Failed to trigger snapshot computation",
    };
  }
};

