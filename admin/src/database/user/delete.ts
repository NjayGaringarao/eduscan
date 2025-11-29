"use server";

import { createLog } from "@/lib/log";
import { User } from "@/models";
import { createClient } from "@/utils/supabase/server";

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
    return { error: `USER CREATION FAILED: ${error}` };
  }
  await createLog({
    type: "ADMIN.DATA",
    title: `User/s Deleted`,
    description: `The following users with the user-id are deleted from the system: [${userIds.join(
      ","
    )}]`,
  });
  return {};
};
