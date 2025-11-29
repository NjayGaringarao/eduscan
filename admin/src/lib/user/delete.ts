"use server";

import { createLog } from "@/lib/log";
import { User } from "@/models";
import { createClient } from "@/utils/supabase/server";
import { updateUserCache } from "./updateCache";

export const deleteUsers = async (
  users: User[]
): Promise<{ error?: string }> => {
  const userIds: string[] = users.map((user) => {
    return user.id;
  });
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("user").delete().in("id", userIds);

    if (error) throw new Error(error.message);
  } catch (error) {
    return { error: `USER DELETION FAILED: ${error}` };
  }
  await createLog({
    type: "ADMIN.DATA",
    title: `User/s Deleted`,
    description: `The following users with the user-id are deleted from the system: [${userIds.join(
      ","
    )}]`,
  });

  // Update user cache in FaceID service (non-blocking)
  try {
    await updateUserCache();
  } catch (cacheError) {
    console.error("Failed to update user cache after deletion:", cacheError);
    // Don't fail the operation if cache update fails
  }

  return {};
};


