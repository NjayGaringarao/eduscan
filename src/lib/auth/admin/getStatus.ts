import { AdminStatus } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const getStatus = async (): Promise<
  { status: AdminStatus; error: null } | { status: null; error: string }
> => {
  try {
    const response = await fetch(`${BASE_URL}/api/admin-status`);

    if (!response.ok) {
      const error = await response.json();
      return {
        status: null,
        error: error?.error || "FAILED TO CONNECT",
      };
    }

    const status = await response.json();
    return { status, error: null };
  } catch {
    return {
      status: null,
      error: "Network or parsing error",
    };
  }
};
