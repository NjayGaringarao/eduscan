"use server";

import { createClient } from "@/utils/supabase/server";

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

  return {};
};
