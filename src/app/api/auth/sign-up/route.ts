import { createClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

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

  // Step 4: Attempt to create the new KIOSK User
  const kioskEmail = nanoid(4).concat("@prmsu.kiosk");
  const {
    data: { user: kiosk },
    error: createKioskError,
  } = await supabase.auth.admin.createUser({
    email: kioskEmail,
    password,
    user_metadata: {
      account_type: "KIOSK",
      email: kioskEmail,
    },
  });

  if (createKioskError) {
    return NextResponse.json(
      { error: `INITIALIZATION FAILED: ${createKioskError.message}` },
      { status: 500 }
    );
  }

  if (!kiosk) {
    return NextResponse.json(
      { error: "INITIALIZATION FAILED: Kiosk creation returned no account." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
