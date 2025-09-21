"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import { createLog } from "@/lib/log";

export const resetPassword = async (
  email: string,
  validation: User | string | null
): Promise<{ error: string | undefined }> => {
  const supabase = await createClient();

  if (!validation) {
    return { error: "RESET FAILED: Invalid request (missing validation)" };
  }

  let captchaToken: string | null = null;

  if (typeof validation === "string") {
    captchaToken = validation;
    if (captchaToken.length === 0) {
      return { error: "RESET FAILED: Missing Captcha Token" };
    }
  } else {
    captchaToken = null;
  }

  // Call Supabase reset
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    captchaToken: captchaToken ?? undefined,
  });

  if (error) {
    return {
      error:
        `RESET FAILED: ${error.message}` ||
        "RESET FAILED: Unknown error occurred.",
    };
  }

  // Log reset request sent
  await createLog({
    type: "SYSTEM.AUTH",
    title: "Password reset requested",
    description: `Password reset email sent to ${email}`,
  });

  return { error: undefined };
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
    // Log successful password update
    await createLog({
      type: "SYSTEM.AUTH",
      title: "Password updated",
      description: `User updated password successfully`,
    });
    revalidatePath("/", "layout");
    redirect("/dashboard");
    return { error: undefined };
  }
};
