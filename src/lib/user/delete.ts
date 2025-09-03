"use server";

import { User } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const deleteUsers = async (
  users: User[]
): Promise<{ error?: string }> => {
  try {
    const userIds: string[] = users.map((user) => {
      return user.user_id;
    });

    const supabase = await createClient();
    const { error } = await supabase
      .from("user")
      .delete()
      .in("user_id", userIds);

    if (error) throw new Error(error.message);
  } catch (error) {
    return { error: `USER CREATION FAILED: ${error}` };
  }
  console.log("lib.user.delete :: Successfully deleted user.");
  return {};
};
