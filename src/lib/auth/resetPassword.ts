"use server";

import { createClient } from "@/utils/supabase/server";

export const resetPassword = async (
  email: string,
  captchaToken: string
): Promise<{
  error: string | undefined;
}> => {
  const supabase = await createClient();

  if (captchaToken.length === 0) {
    return { error: "RESET FAILED: Missing Captcha Token" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    captchaToken: captchaToken,
  });
  if (error) {
    return {
      error:
        `RESET FAILED: ${error.message}` ||
        "RESET FAILED: Unknown error occurred.",
    };
  } else {
    return { error: undefined };
  }
};
