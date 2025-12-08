"use server";

import { createClient } from "@/utils/supabase/server";

interface TrainingSummary {
  success: boolean;
  metadata: {
    training_date: string;
    user_type: string;
    model_filename: string;
    algorithm: string;
    samples_count: number;
    split: string;
    cross_validation: string;
    test_metrics: {
      mae: number;
      rmse: number;
      r2: number;
      roc_auc: number;
    };
    cv_metrics: {
      mae: { mean: number; std: number };
      r2: { mean: number; std: number };
    };
    features_per_sample: number;
    note: string;
  };
  images: {
    scatter: string;
    residuals: string;
    feature_importance: string;
    learning_curves: string;
    distribution: string;
    confusion_matrix: string;
    roc_curve: string;
  };
}

interface GetTrainingSummaryParams {
  user_type: "STUDENT" | "EMPLOYEE";
}

export const getTrainingSummary = async ({
  user_type,
}: GetTrainingSummaryParams): Promise<{
  summary: TrainingSummary | null;
  error: string | null;
}> => {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.functions.invoke(
      "get_training_summary",
      {
        method: "POST",
        body: { user_type },
      }
    );

    if (error) {
      return {
        summary: null,
        error: error.message ?? "Failed to get training summary",
      };
    }

    // Handle if data is a string (double-encoded JSON)
    let parsedData = data;
    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse training summary:", e);
        return {
          summary: null,
          error: "Invalid response format received",
        };
      }
    }

    if (parsedData?.success && parsedData?.metadata) {
      return {
        summary: parsedData as TrainingSummary,
        error: null,
      };
    }

    return {
      summary: null,
      error: parsedData?.error ?? parsedData?.details ?? "Summary not found",
    };
  } catch (err: any) {
    console.error("Get training summary failed:", err);
    return {
      summary: null,
      error: err.message ?? "Failed to get training summary",
    };
  }
};

