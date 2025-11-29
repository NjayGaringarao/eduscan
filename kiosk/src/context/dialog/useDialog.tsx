import { useContext } from "react";
import { DialogContextType } from "@/types/dialog";
import { DialogContext } from "./DialogProvider";

export const useDialog = (): DialogContextType => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
};
