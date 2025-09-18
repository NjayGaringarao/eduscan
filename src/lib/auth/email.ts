"use server";

import { createClient } from "@/utils/supabase/server";
import { createLog } from "@/lib/log";

export const changeEmail = async (
  newEmail: string
): Promise<{ error?: string }> => {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    return { error: `EMAIL CHANGE FAILED: ${error.message}` };
  }

  // Log email change request
  await createLog({
    type: "SYSTEM.AUTH",
    title: "Email change requested",
    description: `User requested email change to ${newEmail}`,
  });

  return {};
};
