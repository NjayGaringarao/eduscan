"use server";

import { put } from "@/database/config";
import { createLog } from "../log";

export const updateAdminName = async (
  name: string
): Promise<{ error?: string }> => {
  try {
    // Validate input
    if (!name || !name.trim()) {
      return { error: "Admin name is required" };
    }

    if (name.trim().length < 2) {
      return { error: "Admin name must be at least 2 characters" };
    }

    // Update config table
    const { error: configError } = await put([
      { key: "admin.name", value: name.trim() },
    ]);

    if (configError) {
      return { error: configError };
    }

    await createLog({
      type: "ADMIN.CONFIG",
      title: "Admin Name Updated",
      description: `Admin name updated to ${name}.`,
    });

    return {};
  } catch (err: any) {
    console.error("Failed to update admin name:", err);
    return { error: err.message ?? "Unknown error" };
  }
};
