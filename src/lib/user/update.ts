"use server";

import { createLog } from "@/lib/log";
import { createClient } from "@/utils/supabase/server";
import { updateUserCache } from "./updateCache";
import { get } from "./get";

interface IUpdateUser {
  user: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    sex: string;
    birth_date: string;
    address: string;
  };
  organizational:
    | {
        user_id: string;
        role: "EMPLOYEE";
        type: string;
        division: string;
        title: string;
        contact_number: string;
      }
    | {
        user_id: string;
        role: "STUDENT";
        department: string;
        program: string;
      };
  guardian?: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    sex: string;
    address: string;
    contact_number: string;
  };
  facialEncoding: number[] | null;
}

export const update = async ({
  user,
  organizational,
  guardian,
  facialEncoding,
}: IUpdateUser): Promise<{ error?: string }> => {
  try {
    // Check if facial encoding changed
    const { user: currentUser } = await get(organizational.user_id);
    const facialEncodingChanged =
      currentUser?.facial_encoding !== facialEncoding &&
      JSON.stringify(currentUser?.facial_encoding) !==
        JSON.stringify(facialEncoding);

    const supabase = await createClient();

    const { error } = await supabase.rpc("update_user", {
      p_user: { id: organizational.user_id, ...user },
      p_organizational: organizational,
      p_guardian: guardian ?? null,
      p_facial_encoding: facialEncoding,
    });

    if (error) throw new Error(error.message);

    await createLog({
      type: "ADMIN.DATA",
      title: `User's (id: ${organizational.user_id}) Information is Updated`,
      description: `A user with the following attribute is updated: [name: '${user.first_name} ${user.last_name}'], [role: ${organizational.role}], [user-id: ${organizational.user_id}].`,
    });

    // Update user cache only if facial encoding changed (non-blocking)
    if (facialEncodingChanged) {
      try {
        await updateUserCache();
      } catch (cacheError) {
        console.error("Failed to update user cache after update:", cacheError);
        // Don't fail the operation if cache update fails
      }
    }

    return {};
  } catch (error) {
    return { error: `USER UPDATE FAILED: ${error}` };
  }
};

/**
 
-- Database function 'update_user':
-- See: supabase/migrations/20250108000002_rpc_update_user.sql

*/
