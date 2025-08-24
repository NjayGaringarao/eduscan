import { AdminStatus } from "@/types/types";
import { createClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

// GET ENDPOINT in getting the admin status
export async function GET() {
  const supabase = createClient();

  const status: AdminStatus = {
    isInitialized: false,
    isVerified: false,
  };

  // Step 1: Attempt to retrieve the admin account
  const { data: adminAccount, error: adminError } = await supabase
    .from("account")
    .select("*")
    .eq("account_type", "ADMIN")
    .maybeSingle();

  if (adminError) {
    return NextResponse.json(
      { error: `Error fetching admin account: ${adminError.message}` },
      { status: 500 }
    );
  }

  // Step 2: If no admin account exists, return default status
  if (!adminAccount) {
    return NextResponse.json(status);
  }

  status.isInitialized = true;

  // Step 3: Fetch corresponding auth user
  const { data: userResult, error: userError } =
    await supabase.auth.admin.getUserById(adminAccount.id);

  if (userError) {
    return NextResponse.json(
      { error: `Error fetching admin user: ${userError.message}` },
      { status: 500 }
    );
  }

  const user = userResult?.user;

  // Step 4: Check email verification
  if (user?.user_metadata?.email_verified) {
    status.isVerified = true;
  }

  return NextResponse.json(status);
}
