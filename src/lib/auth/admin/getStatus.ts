"use server";

import { createClient } from "@/utils/supabase/admin";
import { AdminStatus } from "@/types";

export const getStatus = async (): Promise<
  { status: AdminStatus; error: null } | { status: null; error: string }
> => {
  try {
    const supabase = createClient();

    const status: AdminStatus = {
      isInitialized: false,
      isVerified: false,
    };

    // Step 1: List all auth users (using service_role key)
    const { data: users, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      return {
        status: null,
        error: `Error fetching users: ${listError.message}`,
      };
    }

    if (!users || users.users.length === 0) {
      return { status, error: null }; // no users at all
    }

    // Step 2: Look for an admin account
    const adminUser = users.users.find(
      (u) => u.user_metadata?.account_type === "ADMIN"
    );

    if (!adminUser) {
      return { status, error: null }; // no admin account exists
    }

    status.isInitialized = true;

    // Step 3: Check email verification
    if (
      adminUser.user_metadata?.email_verified ||
      adminUser.email_confirmed_at
    ) {
      status.isVerified = true;
    }

    return { status, error: null };
  } catch (err: any) {
    return {
      status: null,
      error: `UNEXPECTED ERROR: ${err.message ?? "Unknown"}`,
    };
  }
};
