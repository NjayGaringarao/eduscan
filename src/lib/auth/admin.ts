import { AdminStatus } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const getAdminStatus = async (): Promise<
  { status: AdminStatus; error: null } | { status: null; error: string }
> => {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/setup`);

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

export const initializeAdmin = async (
  email: string,
  password: string,
  captcha_token: string
): Promise<{ error: string | undefined }> => {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, captcha_token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: errorData?.error || "INITIALIZATION FAILED: Unknown error.",
      };
    }

    const result = await response.json();
    if (result.success) {
      return { error: undefined };
    }

    // Unexpected result shape
    return { error: "INITIALIZATION FAILED: Unexpected response." };
  } catch (err) {
    console.error("service.admin.initialize :: error", err);
    return { error: "INITIALIZATION FAILED: Network or server error." };
  }
};
