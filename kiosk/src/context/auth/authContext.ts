import { Page } from "@/types/utils";
import { User } from "@supabase/supabase-js";
import { createContext, Dispatch, SetStateAction } from "react";

export type AuthContextType = {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
  user: User | null;
  isLoading: boolean;
  page: Page;
  setPage: Dispatch<SetStateAction<Page>>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
