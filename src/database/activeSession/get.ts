"use server";

import { ActiveSession } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const get = async (
  user_id: string
): Promise<{ session: ActiveSession | null; error?: string }> => {
  try {
    const supabase = await createClient();

    const { data: session, error: sessionError } = await supabase
      .from("active_session")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (sessionError) {
      console.error("Supabase active_session error:", sessionError);
      throw new Error(sessionError.message);
    }

    return { session: session };
  } catch (error) {
    return { session: null, error: `FAILED TO GET USER SESSION: ${error}` };
  }
};
