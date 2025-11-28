"use server";

import { createClient } from "@/utils/supabase/server";

export const getFacialEncoding = async (
  blob: Blob
): Promise<{
  encoding: number[] | null;
  error: string | null;
  matchedUserId: string | null;
}> => {
  const supabase = await createClient();
  try {
    const formData = new FormData();
    formData.append("image", blob);

    const { data, error } = await supabase.functions.invoke("encode_face", {
      body: formData,
      method: "POST",
    });

    if (error) {
      console.error("Supabase function error: ", error);
      return {
        encoding: null,
        error: "Recognition Failed: " + error.message,
        matchedUserId: null,
      };
    }
    return {
      encoding: data.encoding,
      matchedUserId: data.user_id ?? null,
      error: data.error ? "Recognition Failed: " + data.error : null,
    };
  } catch (err: any) {
    console.error("getFaceMatch failed:", err);
    return {
      encoding: null,
      matchedUserId: null,
      error: "Recognition Failed: " + (err.message ?? "Unknown error"),
    };
  }
};
