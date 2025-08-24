const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const signUp = async (
  email: string,
  password: string,
  captcha_token: string
): Promise<{ error: string | undefined }> => {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/sign-up`, {
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
