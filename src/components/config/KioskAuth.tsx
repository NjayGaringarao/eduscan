"use client";

import { cn } from "@/utils/style";
import React, { useEffect, useState } from "react";
import TextBox from "../TextBox";
import Button from "../Button";
import { regex } from "@/constants/regex";
import * as configDB from "@/database/config";
import { updateKioskAuth } from "@/lib/config/updateKioskAuth";

// error helpers
interface FormError {
  type: string | null;
  message: string | null;
}
const defaultFormError: FormError = { type: null, message: null };

const validateKioskForm = (form: {
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

const KioskAuth = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [initialConfig, setInitialConfig] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<FormError>(defaultFormError);
  const [isModified, setIsModified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load kiosk config on mount
  useEffect(() => {
    const loadConfig = async () => {
      const res = await configDB.get(["kiosk.email", "kiosk.password"]);

      const email =
        res.configs.find((c) => c.key === "kiosk.email")?.value ?? "";
      const password =
        res.configs.find((c) => c.key === "kiosk.password")?.value ?? "";

      setForm({ email, password });
      setInitialConfig({ email, password });
    };

    loadConfig();
  }, []);

  // Track modifications + validate
  useEffect(() => {
    setIsModified(
      form.email !== initialConfig.email ||
        form.password !== initialConfig.password
    );

    setError(defaultFormError); // reset
    const formError = validateKioskForm(form);
    if (formError) {
      setError(formError);
    }
  }, [form, initialConfig]);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const { error } = await updateKioskAuth(form.email, form.password);
      if (error) throw new Error(error);

      setInitialConfig(form);
      setIsModified(false);
    } catch (e) {
      console.error("Failed to update kiosk config", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-xl p-6",
        "bg-background/70 backdrop-blur-lg border border-primary/20",
        "flex flex-col items-center gap-6"
      )}
    >
      <div className="w-full flex flex-col">
        <p className="text-primary font-semibold text-xl">
          Kiosk Authentication
        </p>
        <p className="text-textBody text-base mt-2">
          Update the Kiosk authentication credentials (Service Address and
          Password) to ensure secure access and prevent unauthorized use.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <TextBox
            title="Service Address"
            value={form.email}
            setValue={(e) => setForm((prev) => ({ ...prev, email: e }))}
            isValueInvalid={error.type === "kiosk.email"}
          />
          {error.type === "kiosk.email" && (
            <div className="text-error text-sm font-light">{error.message}</div>
          )}
        </div>

        <div className="flex flex-col">
          <TextBox
            title="Password"
            value={form.password}
            setValue={(e) => setForm((prev) => ({ ...prev, password: e }))}
            isPassword
            isValueInvalid={error.type === "kiosk.password"}
          />
          {error.type === "kiosk.password" && (
            <div className="text-error text-sm font-light">{error.message}</div>
          )}
        </div>
      </div>

      <Button
        title={isLoading ? "Updating..." : "Update"}
        className="self-end w-36"
        disabled={!!error.type || isLoading || !isModified}
        onClick={handleUpdate}
      />
    </div>
  );
};

export default KioskAuth;
