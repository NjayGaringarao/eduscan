"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "./getCurrentUser";
import { createLog } from "@/lib/log";

export const signOut = async (): Promise<{ error?: string }> => {
  const supabase = await createClient();

  const user = await getCurrentUser();

  if (!user) {
    revalidatePath("/dashboard", "layout");
    redirect("/auth");
    return {};
  }

  const error = await supabase.auth.signOut();

  if (!error.error) {
    // Log successful sign-out
    await createLog({
      type: "SYSTEM.AUTH",
      title: "Sign out successful",
      description: `User ${user.email ?? user.id} signed out successfully`,
    });
    revalidatePath("/dashboard", "layout");
    redirect("/auth");
    return {};
  } else {
    return { error: `SIGN-OUT FAILED : ${error.error}` };
  }
};
