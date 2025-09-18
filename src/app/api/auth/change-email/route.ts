import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createLog } from "@/lib/log";
import { type EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const confirmed_email = searchParams.get("confirmed_email");
  const next = searchParams.get("next") ?? "/";

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;

  if (token_hash && type === "email_change") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      if (confirmed_email) {
        redirectTo.searchParams.set("confirmed_email", confirmed_email);
      }
      // Log email change verification success
      await createLog({
        type: "SYSTEM.AUTH",
        title: "Email change verified",
        description: `Email change verified for ${confirmed_email ?? "user"}`,
      });
      return NextResponse.redirect(redirectTo);
    }
  }

  // error fallback
  redirectTo.pathname = "/error";
  redirectTo.search =
    "?title=Invalid%20Email%20Change%20Link&subtitle=This%20confirmation%20link%20may%20be%20expired%20or%20invalid.";
  return NextResponse.redirect(redirectTo);
}
