"use server";

import { createClient } from "@/utils/supabase/server";
import { RealtimeUserStatus } from "./types";

export const getUserStatus = async (): Promise<{
  realtimeStatus?: RealtimeUserStatus;
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_user_status");

    if (error) {
      return { error: error.message };
    }
    return { realtimeStatus: data };
  } catch (error) {
    console.log(`lib.dashboard.getUserStatus :: ${error}`);
    return { error: `Failed to fetch data: ${error}` };
  }
};
