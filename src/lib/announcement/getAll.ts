"use server";

import { Announcement } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const getAll = async (): Promise<{
  announcements: Announcement[];
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("announcement")
      .select("announcement_id, title, message, recipient, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return { announcements: [], error: error.message };
    }

    return { announcements: data as Announcement[] };
  } catch (err: any) {
    return { announcements: [], error: err.message };
  }
};
