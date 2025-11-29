"use server";

import { createClient } from "@/utils/supabase/server";
import { createLog } from "../log";

export const unlinkUsersFromSchedule = async (
  scheduleId: string,
  userIds: string[]
): Promise<{ error?: string }> => {
  try {
    const supabase = await createClient();

    // Call the RPC function to unlink specific users from the schedule
    const { data, error } = await supabase.rpc("unlink_user_schedule", {
      p_schedule_id: parseInt(scheduleId),
      p_user_ids: userIds,
    });

    if (error) return { error: error.message };

    const unlinkedCount = data?.[0]?.unlinked_users_count || 0;
    await createLog({
      type: "ADMIN.OPERATION",
      title: "Users Unlinked from Schedule",
      description: `${unlinkedCount} user(s) unlinked from schedule '${scheduleId}'.`,
    });

    return {};
  } catch (err: any) {
    return { error: err.message };
  }
};

/*
SQL RPC Function Implementation:

-- Supabase sql command for creating the rpc functions
-- DO NOT REMOVE FOR FUTURE REFERENCES

drop function if exists public.unlink_user_schedule(BIGINT, TEXT[]);

CREATE OR REPLACE FUNCTION unlink_user_schedule(
    p_schedule_id BIGINT,
    p_user_ids TEXT[] DEFAULT NULL
)
RETURNS TABLE(unlinked_users_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unlinked_users_count INTEGER := 0;
BEGIN
    -- If specific user IDs are provided, unlink only those users
    IF p_user_ids IS NOT NULL AND array_length(p_user_ids, 1) > 0 THEN
        UPDATE public."user" 
        SET schedule_id = NULL 
        WHERE schedule_id = p_schedule_id 
        AND user_id = ANY(p_user_ids);
    ELSE
        -- If no specific user IDs provided, unlink all users from this schedule
        UPDATE public."user" 
        SET schedule_id = NULL 
        WHERE schedule_id = p_schedule_id;
    END IF;
    
    -- Get the count of users that were unlinked
    GET DIAGNOSTICS v_unlinked_users_count = ROW_COUNT;
    
    -- Return the count of unlinked users
    RETURN QUERY SELECT v_unlinked_users_count;
END;
$$;
*/
