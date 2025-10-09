import { VALID_ACTIONS } from "./constants.ts";
import type { Action } from "./types.ts";

export interface ValidationResult {
  isValid: boolean;
  user_id?: string;
  action?: Action;
  error?: string;
}

export function validateFormData(formData: FormData): ValidationResult {
  const user_id = formData.get("user_id");
  const action = formData.get("action");

  if (
    !user_id ||
    !action ||
    typeof user_id !== "string" ||
    typeof action !== "string" ||
    !VALID_ACTIONS.includes(action as Action)
  ) {
    return {
      isValid: false,
      error: "Incomplete form",
    };
  }

  return {
    isValid: true,
    user_id,
    action: action as Action,
  };
}
