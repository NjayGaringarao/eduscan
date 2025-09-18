"use server";

import { put } from "@/database/config";
import { createLog } from "../log";

export const updateAdminTitle = async (
  title: string
): Promise<{ error?: string }> => {
  try {
    // Validate input
    if (!title || !title.trim()) {
      return { error: "Job title is required" };
    }

    if (title.trim().length < 2) {
      return { error: "Job title must be at least 2 characters" };
    }

    // Update config table
    const { error: configError } = await put([
      { key: "admin.title", value: title.trim() },
    ]);

    if (configError) {
      return { error: configError };
    }

    await createLog({
      type: "ADMIN.CONFIG",
      title: "Admin Title Updated",
      description: `Admin title updated to ${title}.`,
    });

    return {};
  } catch (err: any) {
    console.error("Failed to update admin title:", err);
    return { error: err.message ?? "Unknown error" };
  }
};
