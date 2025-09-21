"use server";

import { createClient } from "@/utils/supabase/server";

export const getUserStatus = async (): Promise<{
  loggedIn: number;
  total: number;
  error?: string;
}> => {
  const supabase = await createClient();

  // Count total users
  const { count: total, error: totalError } = await supabase
    .from("user")
    .select("user_id", { count: "exact", head: true });

  if (totalError) {
    return { loggedIn: 0, total: 0, error: totalError.message };
  }

  // Count currently logged in users via `active_session`
  const { count: loggedIn, error: loggedInError } = await supabase
    .from("active_session")
    .select("user_id", { count: "exact", head: true });

  if (loggedInError) {
    return { loggedIn: 0, total: 0, error: loggedInError.message };
  }

  return { loggedIn: loggedIn ?? 0, total: total ?? 0 };
};
