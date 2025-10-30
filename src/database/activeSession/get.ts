"use server";

import { Session, ActiveSession } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const get = async (
  user_id: string
): Promise<{ session: ActiveSession | null; error?: string }> => {
  try {
    const supabase = await createClient();

    const { data: session, error: sessionError } = await supabase
      .from("session")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .maybeSingle();

    if (sessionError) {
      console.error("Supabase session error:", sessionError);
      throw new Error(sessionError.message);
    }

    // Convert new Session format to ActiveSession for backward compatibility
    const activeSession: ActiveSession | null = session
      ? {
          id: session.id,
          user_id: session.user_id,
          login_time: new Date(session.arrival),
        }
      : null;

    return { session: activeSession };
  } catch (error) {
    return { session: null, error: `FAILED TO GET USER SESSION: ${error}` };
  }
};

// New function for getting session with full details
export const getSession = async (
  user_id: string
): Promise<{ session: Session | null; error?: string }> => {
  try {
    const supabase = await createClient();

    const { data: session, error: sessionError } = await supabase
      .from("session")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .maybeSingle();

    if (sessionError) {
      console.error("Supabase session error:", sessionError);
      throw new Error(sessionError.message);
    }

    return { session: session };
  } catch (error) {
    return { session: null, error: `FAILED TO GET USER SESSION: ${error}` };
  }
};
