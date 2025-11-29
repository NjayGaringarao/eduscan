import { useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabaseClient";
import { Page } from "@/types/utils";
import { useDialog } from "@/context/dialog";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { alert } = useDialog();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<Page>("auth");

  // helper: validate token by asking supabase for the user associated with the JWT
  const validateTokenAndSetUser = async (accessToken?: string | null) => {
    if (!accessToken) {
      setUser(null);
      return;
    }

    try {
      // verify that token is still valid and that the user exists
      const { data: userData, error } = await supabase.auth.getUser(
        accessToken
      );

      if (error || !userData?.user) {
        // token invalid or user removed → force sign out
        console.warn(
          "Token validation failed or user missing:",
          error?.message ?? "no user"
        );
        await supabase.auth.signOut();
        setUser(null);
      } else {
        setUser(userData.user);
      }
    } catch (err) {
      console.error("validateTokenAndSetUser error:", err);
      // network or unexpected error: keep user null to be safe
      setUser(null);
    }
  };

  useEffect(() => {
    // init: restore session and validate user existence
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        await validateTokenAndSetUser(session?.access_token ?? null);
      } catch (err: any) {
        // If getSession fails, just treat as no session (not fatal)
        console.warn("initAuth getSession warning:", err?.message ?? err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // subscribe to auth changes and validate token on every change
    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true);
        try {
          await validateTokenAndSetUser(session?.access_token ?? null);
        } finally {
          setIsLoading(false);
        }
      }
    );

    // cleanup subscription
    const subscription = (data as any)?.subscription ?? (data as any);
    return () => {
      try {
        if (subscription?.unsubscribe) subscription.unsubscribe();
        else if (subscription?.subscription?.unsubscribe)
          subscription.subscription.unsubscribe();
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, []);

  // reactively guard pages by user role
  useEffect(() => {
    if (!user) {
      setPage("auth");
      return;
    }

    const accountType = (user as any)?.user_metadata?.account_type;

    if (accountType === "KIOSK") {
      setPage("kiosk");
    } else {
      (async () => {
        await supabase.auth.signOut();
        setUser(null);
        await alert({
          title: "Login Failed",
          description: "Invalid account type.",
          mode: "ERROR",
        });
        setPage("auth");
      })();
    }
  }, [user]);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Email not confirmed") {
          return {
            error:
              "EMAIL NOT VERIFIED: Please check your inbox for a verification link.",
          };
        } else if (error.message === "Invalid login credentials") {
          return { error: "INCORRECT PASSWORD: Please try again." };
        } else {
          return { error: `SIGN IN ERROR: ${error.message}` };
        }
      }

      // onAuthStateChange will validate and set user automatically
      return { error: undefined };
    } catch (err: any) {
      console.error("service.auth.signIn ::", err);
      if (
        err?.message?.includes("Failed to fetch") ||
        err?.name === "TypeError"
      ) {
        return {
          error: "NETWORK ERROR: Please check your internet connection.",
        };
      }
      return {
        error: err?.message || "SIGN IN ERROR: Unknown error occurred.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: `SIGN OUT ERROR: ${error.message}` };
      }
      setUser(null);
      setPage("auth");
      return { error: undefined };
    } catch (err: any) {
      console.error("service.auth.signOut ::", err);
      return {
        error: err?.message || "SIGN OUT ERROR: Unknown error occurred.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        isLoading,
        user,
        page,
        setPage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
