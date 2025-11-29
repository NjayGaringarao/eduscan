"use server";

import { Config } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const get = async (
  keys: string[]
): Promise<{ configs: Config[]; error?: string }> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("config")
    .select("key, value")
    .in("key", keys);

  if (error) {
    return { configs: [], error: error.message };
  }

  return { configs: data as Config[] };
};
