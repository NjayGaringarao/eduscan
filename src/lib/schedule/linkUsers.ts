"use server";

import { createClient } from "@/utils/supabase/server";
import { createLog } from "@/lib/log";

export const linkUserToSchedule = async (
  userId: string,
  scheduleId: string
): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    // Update user's schedule_id to link them to the schedule
    const { error } = await supabase
      .from("user")
      .update({ schedule_id: scheduleId })
      .eq("id", userId);

    if (error) {
      return { error: error.message };
    }

    // Create log entry
    await createLog({
      type: "ADMIN.OPERATION",
      title: "User Linked to Schedule",
      description: `User '${userId}' was linked to schedule '${scheduleId}'.`,
    });

    return {};
  } catch (error) {
    console.error("Error linking user to schedule:", error);
    return { error: `Failed to link user to schedule: ${error}` };
  }
};

export const linkUsersToSchedule = async (
  userIds: string[],
  scheduleId: string
): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    // Update multiple users' schedule_id to link them to the schedule
    const { error } = await supabase
      .from("user")
      .update({ schedule_id: scheduleId })
      .in("id", userIds);

    if (error) {
      return { error: error.message };
    }

    // Create log entry
    await createLog({
      type: "ADMIN.OPERATION",
      title: "Users Linked to Schedule",
      description: `${userIds.length} user(s) were linked to schedule '${scheduleId}'.`,
    });

    return {};
  } catch (error) {
    console.error("Error linking users to schedule:", error);
    return { error: `Failed to link users to schedule: ${error}` };
  }
};
