"use server";

import { createClient } from "@/utils/supabase/server";

export const updateUserCache = async (): Promise<void> => {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.functions.invoke("update_user_cache", {
      method: "POST",
    });

    if (error) {
      console.error("Failed to update user cache:", error);
      // Don't throw - cache update failures shouldn't block operations
    }
  } catch (err: any) {
    console.error("Error updating user cache:", err);
    // Don't throw - cache update failures shouldn't block operations
  }
};


