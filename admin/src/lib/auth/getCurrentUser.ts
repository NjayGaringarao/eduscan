"use server";

import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";

export const getCurrentUser = async (): Promise<User | undefined> => {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.log("service.auth.getCurrentUser ::", error);
      return undefined;
    }
    return data.user;
  } catch (error) {
    // supabase-js throws AuthSessionMissingError (instead of returning it
    // as `error`) when there is no session cookie at all, e.g. a first
    // visit with an empty browser. Treat it the same as "no user".
    console.log("service.auth.getCurrentUser ::", error);
    return undefined;
  }
};
