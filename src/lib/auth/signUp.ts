"use server";

import { createClient } from "@/utils/supabase/admin";
import { nanoid } from "nanoid";

export const signUp = async (
  email: string,
  password: string,
  captcha_token: string
): Promise<{ error: string | undefined }> => {
  try {
    const supabase = createClient();

    // Step 1: Validate inputs
    if (!email || !password || !captcha_token) {
      return { error: "INITIALIZATION FAILED: Missing parameter(s)." };
    }

    // Step 2: Check if an ADMIN already exists
    const { data: users, error: listError } =
      await supabase.auth.admin.listUsers();
    if (listError) {
      return { error: `Error checking existing admin: ${listError.message}` };
    }

    const adminUser = users.users.find(
      (u) => u.user_metadata?.account_type === "ADMIN"
    );
    if (adminUser) {
      return {
        error: "INITIALIZATION FAILED: An admin account already exists.",
      };
    }

    // Step 3: Create the ADMIN user
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
      return { error: `INITIALIZATION FAILED: ${signUpError.message}` };
    }
    if (!user) {
      return {
        error: "INITIALIZATION FAILED: User creation returned no user.",
      };
    }

    // Step 4: Create the KIOSK user (with auto-confirmed email + random password)
    const kioskEmail = `${nanoid(4)}@prmsu.kiosk`;
    const kioskPassword = "KIOSK@l03e1t3"; // random 16-char password

    const { error: createKioskError } = await supabase.auth.admin.createUser({
      email: kioskEmail,
      password: kioskPassword,
      user_metadata: {
        account_type: "KIOSK",
        email: kioskEmail,
      },
      email_confirm: true,
    });
    if (createKioskError) {
      return { error: `INITIALIZATION FAILED: ${createKioskError.message}` };
    }

    // Step 5: Initialize config table for kiosk using admin client
    const { error: configError } = await supabase.from("config").upsert(
      [
        { key: "kiosk.email", value: kioskEmail },
        { key: "kiosk.password", value: kioskPassword },
        { key: "kiosk.state", value: "ENABLED" },
      ],
      { onConflict: "key" }
    );

    if (configError) {
      return { error: `INITIALIZATION FAILED: ${configError.message}` };
    }

    return { error: undefined };
  } catch (err: any) {
    console.error("signUp :: unexpected error", err);
    return { error: "INITIALIZATION FAILED: Network or server error." };
  }
};
