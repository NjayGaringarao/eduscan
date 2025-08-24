"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "./getCurrentUser";

export const signOut = async (): Promise<{ error?: string }> => {
  const supabase = await createClient();

  const user = await getCurrentUser();

  if (!user) {
    revalidatePath("/home", "layout");
    redirect("/auth");
    return {};
  }

  const error = await supabase.auth.signOut();

  if (!error.error) {
    revalidatePath("/home", "layout");
    redirect("/auth");
    return {};
  } else {
    return { error: `SIGN-OUT FAILED : ${error.error}` };
  }
};
