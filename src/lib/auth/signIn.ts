"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createLog } from "@/lib/log";

export const signIn = async (
  email: string,
  password: string
): Promise<{ error: string | undefined }> => {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      if (error.message === "Email not confirmed") {
        return {
          error:
            "EMAIL NOT VERFIED: Please check your inbox for a verification link.",
        };
      } else if (error.message === "Invalid login credentials") {
        return { error: "INCORRECT PASSWORD: Please try again." };
      } else {
        return { error: `SIGN IN ERROR: ${error}` };
      }
    }
    // Log successful sign-in
    await createLog({
      type: "SYSTEM.AUTH",
      title: "Sign in successful",
      description: `User ${email} signed in successfully`,
    });
  } catch (error) {
    console.log("service.auth.signIn ::", error);
    return {
      error: (error as string) || "SIGN IN ERROR: Unknown error occurred.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/home");
  // Added a return to satisfy the return type, though redirect should not return
  return { error: undefined };
};
