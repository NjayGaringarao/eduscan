"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export const updatePassword = async (
  newPassword: string
): Promise<{ error: string | undefined }> => {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return {
      error:
        `UPDATE FAILED: ${error.message}` ||
        "UPDATE FAILED: Unknown error occurred.",
    };
  } else {
    revalidatePath("/", "layout");
    redirect("/home");
    return { error: undefined };
  }
};
