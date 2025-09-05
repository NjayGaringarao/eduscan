"use server";

import { User } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const getFacialEncoding = async (
  blob: Blob
): Promise<{
  encoding: number[] | null;
  error: string | null;
  matchedUser: User | null;
}> => {
  const supabase = await createClient();
  try {
    const formData = new FormData();
    formData.append("image", blob);

    const { data, error } = await supabase.functions.invoke("face-encoding", {
      body: formData,
      method: "POST",
    });

    if (error) {
      console.error("Supabase function error: ", error);
      return {
        encoding: null,
        error: "Recognition Failed: " + error.message,
        matchedUser: null,
      };
    }
    return {
      encoding: data.encoding,
      matchedUser: data.user ?? null,
      error: data.error ? "Recognition Failed: " + data.error : null,
    };
  } catch (err: any) {
    console.error("getFaceMatch failed:", err);
    return {
      encoding: null,
      matchedUser: null,
      error: "Recognition Failed: " + (err.message ?? "Unknown error"),
    };
  }
};
