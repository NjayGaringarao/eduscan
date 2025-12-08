"use server";

import { createClient } from "@/utils/supabase/server";

interface TrainModelParams {
  user_type: "STUDENT" | "EMPLOYEE";
  dataset_file?: File | null;
}

export const trainModel = async ({
  user_type,
  dataset_file,
}: TrainModelParams): Promise<{ success?: boolean; error?: string }> => {
  const supabase = await createClient();

  try {
    let data, error;

    // If dataset file is provided, send as FormData
    if (dataset_file) {
      const formData = new FormData();
      formData.append("user_type", user_type);
      formData.append("dataset_file", dataset_file);

      const result = await supabase.functions.invoke("train_model", {
        body: formData,
        method: "POST",
      });
      data = result.data;
      error = result.error;
    } else {
      // No file, use JSON body (backward compatible)
      const result = await supabase.functions.invoke("train_model", {
        body: { user_type },
      });
      data = result.data;
      error = result.error;
    }

    if (error) {
      return { error: error.message ?? "Failed to train model" };
    }

    // Handle if data is a string (double-encoded JSON)
    let parsedData = data;
    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse training response:", e);
        return { error: "Invalid response format received" };
      }
    }

    if (parsedData?.success) {
      return { success: true };
    }

    return {
      error: parsedData?.error ?? parsedData?.details ?? "Training failed",
    };
  } catch (err: any) {
    console.error("Train model failed:", err);
    return { error: err.message ?? "Failed to train model" };
  }
};

