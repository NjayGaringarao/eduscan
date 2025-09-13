import { regex } from "@/constants/regex";

export interface FormError {
  type: string | null;
  message: string | null;
}

export const validateKioskForm = (form: {
  email: string;
  password: string;
}): FormError | null => {
  if (!regex.email.test(form.email)) {
    return {
      type: "kiosk.email",
      message: "* A valid service address is required.",
    };
  }

  if (!regex.password.test(form.password)) {
    return {
      type: "kiosk.password",
      message: "* A valid password is required.",
    };
  }

  return null;
};
