import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = "/error";
  redirectTo.search =
    "?title=Invalid%20Reset%20Link&subtitle=The%20reset%20link%20may%20be%20expired%20or%20invalid.%20Please%20make%20sure%20you've%20clicked%20the%20latest%20link.%20You%20may%20also%20request%20a%20new%20password%20reset%20link%20or%20contact%20support%20if%20the%20issue%20persists.";
  return NextResponse.redirect(redirectTo);
}
