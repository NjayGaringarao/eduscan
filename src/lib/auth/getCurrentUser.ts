"use server";

import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";

export const getCurrentUser = async (): Promise<User | undefined> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.log("service.auth.getCurrentUser ::", error);
    return undefined;
  } else {
    return data.user;
  }
};
