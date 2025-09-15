"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, changeEmail } from "@/lib/auth";
import { User } from "@supabase/supabase-js";
import TextBox from "@/components/TextBox";
import Button from "@/components/Button";
import { regex } from "@/constants/regex";
import { cn } from "@/utils/style";
import Box from "../container/Box";

// error helpers
interface FormError {
  type: string | null;
  message: string | null;
}
const defaultFormError: FormError = { type: null, message: null };

const validateNewEmail = (email: string): FormError | null => {
  if (!regex.email.test(email)) {
    return {
      type: "admin.new_email",
      message: "* A valid email address is required.",
    };
  }
  return null;
};

const AdminChangeEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<FormError>(defaultFormError);

  // Load current user
  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          alert("No admin email found.");
        }
      } catch {
        alert("Failed to fetch admin email.");
      }
    };

    initialize();
  }, []);

  // Validate on input change
  useEffect(() => {
    setError(defaultFormError); // reset
    const formError = validateNewEmail(newEmail);
    if (formError) {
      setError(formError);
    }
  }, [newEmail]);

  const handleEmailChange = async () => {
    // if error already exists, stop
    if (error.type) return;

    setIsLoading(true);

    const { error: changeError } = await changeEmail(newEmail);

    if (changeError) {
      setError({ type: "admin.new_email", message: changeError });
    } else {
      alert(
        "Email change initiated. Please check the inbox of both new and old email to confirm."
      );
      setNewEmail("");
      setIsSent(true);
    }

    setIsLoading(false);
  };

  return (
    <Box containerClassName={cn("flex flex-col gap-4 p-6")}>
      <div className="flex-1 flex flex-col">
        <p className="text-primary font-semibold text-xl">Change Email</p>
        <p className="text-textBody text-base mt-2">
          A confirmation email will be sent to your current and new email
          addresses. You need to click the confirmation link from both email
          before the change takes effect.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:items-start">
        <TextBox
          title="Current Email Address"
          setValue={() => {}}
          value={user?.email ?? ""}
          disabled
          containerClassName="w-full"
        />

        <div className="flex flex-col w-full">
          <TextBox
            title="New Email Address"
            value={newEmail}
            setValue={(e) => setNewEmail(e)}
            containerClassName="w-full"
            isValueInvalid={error.type === "admin.new_email"}
            disabled={isLoading || isSent}
          />
          {error.type === "admin.new_email" && (
            <div className="text-error text-sm font-light">{error.message}</div>
          )}
        </div>
      </div>

      <Button
        title={isLoading ? "Sending..." : "Change Email"}
        onClick={handleEmailChange}
        className="self-end w-36"
        disabled={!!error.type || isLoading || isSent}
      />
    </Box>
  );
};

export default AdminChangeEmail;
