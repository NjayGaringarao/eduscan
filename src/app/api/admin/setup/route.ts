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

// POST ENDPOINT in Creating an admin account
export async function POST(request: Request) {
  const supabase = createClient();

  let email: string;
  let password: string;
  let captcha_token: string;

  // Step 1: Parse and validate request body
  try {
    const body = await request.json();
    email = body.email;
    password = body.password;
    captcha_token = body.captcha_token;

    if (!email || !password || !captcha_token) {
      return NextResponse.json(
        { error: "INITIALIZATION FAILED: Missing parameter(s)." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.log(`api/admin/setup :: ${error}`);
    return NextResponse.json(
      { error: "INITIALIZATION FAILED: Invalid JSON body." },
      { status: 400 }
    );
  }

  // Step 2: Check if an ADMIN account already exists
  const { data: adminAccount, error: fetchError } = await supabase
    .from("account")
    .select("*")
    .eq("account_type", "ADMIN")
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { error: `Error checking for existing admin: ${fetchError.message}` },
      { status: 500 }
    );
  }

  if (adminAccount) {
    return NextResponse.json(
      { error: "INITIALIZATION FAILED: An admin account already exists." },
      { status: 400 }
    );
  }

  // Step 3: Attempt to create the new ADMIN user
  const {
    data: { user },
    error: signUpError,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      captchaToken: captcha_token,
      data: {
        account_type: "ADMIN",
        email,
      },
    },
  });

  if (signUpError) {
    return NextResponse.json(
      { error: `INITIALIZATION FAILED: ${signUpError.message}` },
      { status: 500 }
    );
  }

  if (!user) {
    return NextResponse.json(
      { error: "INITIALIZATION FAILED: User creation returned no user." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// DELETE endpoint to remove the admin account if criteria are met
export async function DELETE() {
  const supabase = createClient();

  // Fetch the single admin account
  const { data: adminAccount, error: fetchError } = await supabase
    .from("account")
    .select("*")
    .eq("account_type", "ADMIN")
    .single(); // ensures we get exactly one or fail

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      // No rows found
      return NextResponse.json(
        {
          error:
            "RESET FAILED: No admin account exists. Reset criteria not met.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Error fetching admin account: ${fetchError.message}` },
      { status: 500 }
    );
  }

  // Fetch the user from Supabase Auth using the admin's ID
  const { data: userResult, error: userError } =
    await supabase.auth.admin.getUserById(adminAccount.id);

  if (userError) {
    return NextResponse.json(
      { error: `Error fetching auth user: ${userError.message}` },
      { status: 500 }
    );
  }

  const user = userResult?.user;

  if (!user) {
    return NextResponse.json(
      { error: "FAILED: Admin user not found in Supabase Auth." },
      { status: 500 }
    );
  }

  const isEmailVerified = user.user_metadata?.email_verified;

  // Only delete the admin if the email is NOT verified
  if (!isEmailVerified) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      adminAccount.id
    );

    if (deleteError) {
      return NextResponse.json(
        {
          error: `RESET FAILED: Could not delete admin user. ${deleteError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "RESET FAILED: Admin email is verified. Reset criteria not met." },
    { status: 400 }
  );
}
