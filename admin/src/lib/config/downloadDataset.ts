"use server";

import { createClient } from "@/utils/supabase/server";

interface DownloadDatasetParams {
  user_type: "STUDENT" | "EMPLOYEE";
  balance_distribution?: boolean;
}

export const downloadDataset = async ({
  user_type,
  balance_distribution = false,
}: DownloadDatasetParams): Promise<{ buffer?: Uint8Array; error?: string }> => {
  const supabase = await createClient();

  try {
    // First, generate the dataset
    const { data: generateData, error: generateError } =
      await supabase.functions.invoke("download_dataset", {
        method: "POST",
        body: { action: "generate", user_type, balance_distribution },
      });

    if (generateError) {
      return { error: generateError.message ?? "Failed to generate dataset" };
    }

    // Handle if generateData is a string (double-encoded JSON)
    let parsedGenerateData = generateData;
    if (typeof generateData === "string") {
      try {
        parsedGenerateData = JSON.parse(generateData);
      } catch (e) {
        // If parsing fails, continue with original data
      }
    }

    // Then, download the dataset
    const { data: downloadData, error: downloadError } =
      await supabase.functions.invoke("download_dataset", {
        method: "POST",
        body: { action: "download", user_type },
      });

    if (downloadError) {
      return { error: downloadError.message ?? "Failed to download dataset" };
    }

    // Handle if data is a string (JSON content)
    let jsonContent: string;
    if (typeof downloadData === "string") {
      jsonContent = downloadData;
    } else {
      jsonContent = JSON.stringify(downloadData);
    }

    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const buffer = encoder.encode(jsonContent);

    return { buffer };
  } catch (err: any) {
    console.error("Download dataset failed:", err);
    return { error: err.message ?? "Failed to download dataset" };
  }
};

