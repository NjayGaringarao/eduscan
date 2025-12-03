import { User } from "@/models";
import { supabase } from "@/utils/supabaseClient";

export const setUserLog = async (
  user_id: string,
  action: "TIME_IN" | "TIME_OUT"
): Promise<{
  employee: User | null;
  reference_id: string | number | null;
  error: [string, string] | null;
  debug?: any;
}> => {
  try {
    const formData = new FormData();
    formData.append("user_id", user_id);
    formData.append("action", action);

    const { data, error } = await supabase.functions.invoke("log_attendance", {
      body: formData,
    });

    console.log("Supabase function response:", { data, error });

    const result = JSON.parse(data);
    console.log("Parsed result:", result);

    if (error) {
      console.error("Supabase functions.invoke error:", error);
      return {
        employee: null,
        reference_id: null,
        error: ["Logging Failed", error.message ?? String(error)],
      };
    }

    if (result?.error) {
      return {
        employee: null,
        reference_id: null,
        error: ["Logging Failed", String(result.error)],
      };
    }

    return {
      employee: result.employee,
      reference_id: result.reference_id ?? null,
      error: null,
      debug: result.debug,
    };
  } catch (error: any) {
    console.error("setUserLog failed:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      type: typeof error,
    });
    return {
      employee: null,
      reference_id: null,
      error: [
        "Logging Failed",
        error?.message || String(error) || "Unknown error",
      ],
      debug: {
        hasSchedule: false,
        scheduleId: null,
        dayOfWeek: null,
        slotFound: false,
        slotError: `Client error: ${error?.message || String(error)}`,
        timeCalculation: null,
      },
    };
  }
};
