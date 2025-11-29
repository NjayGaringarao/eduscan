"use server";

import { Config } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const put = async (config: Config[]): Promise<{ error?: string }> => {
  const supabase = await createClient();

  const { error } = await supabase
    .from("config")
    .upsert(config, { onConflict: "key" });

  if (error) return { error: error.message };
  return {};
};
