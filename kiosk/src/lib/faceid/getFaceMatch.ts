import { Session, User } from "@/models";
import { supabase } from "@/utils/supabaseClient";

export const getFaceMatch = async (
  image: Blob
): Promise<{
  is_spoof: boolean | null;
  user: User | null;
  error: [string, string] | null;
  session: Session | null;
}> => {
  try {
    const formData = new FormData();
    formData.append("image", image);

    const { data, error } = await supabase.functions.invoke("match_face", {
      body: formData,
      method: "POST",
    });

    if (error) {
      console.error("Supabase function error:", error);
      return {
        is_spoof: null,
        user: null,
        error: ["Recognition Failed", error.message],
        session: null,
      };
    }

    const result = JSON.parse(data);

    return {
      is_spoof: result.is_spoof ?? null,
      user: result.user ?? null,
      error: result.error ? ["Recognition Failed", result.error] : null,
      session: result.session
        ? {
            ...result.session,
            arrival: new Date(result.session.arrival),
            departure: result.session.departure
              ? new Date(result.session.departure)
              : undefined,
          }
        : null,
    };
  } catch (err: any) {
    console.error("getFaceMatch failed:", err);
    return {
      is_spoof: null,
      user: null,
      error: ["Recognition Failed", err.message ?? "Unknown error"],
      session: null,
    };
  }
};
