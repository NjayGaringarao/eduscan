"use client";

import { cn } from "@/utils/style";
import React, { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { changeEmail } from "@/lib/auth";
import { User } from "@supabase/supabase-js";
import TextBox from "@/components/TextBox";
import Button from "@/components/Button";
import { regex } from "@/constants/regex";
import { is } from "date-fns/locale";

const AdminChangeEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");

  const initialize = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        alert("No admin email found.");
      }
    } catch (err: any) {
      alert("Failed to fetch admin email.");
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  const handleEmailChange = async () => {
    if (!regex.email.test(newEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setError("");

    const { error } = await changeEmail(newEmail);

    if (error) {
      setError(error);
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
    <div
      className={cn(
        "relative w-full rounded-xl p-6",
        "bg-background/70 backdrop-blur-lg border border-primary/20",
        "flex flex-col gap-4"
      )}
    >
      <div className="flex-1 flex flex-col">
        <p className="text-primary font-semibold text-xl">Change Email</p>
        <p className="text-textBody text-base mt-2">
          A confirmation email will be sent to your current and new email
          addresses. You need to click the confirmation link from both email
          before the change takes effect.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-center">
        <TextBox
          title="Current Email Address"
          setValue={() => {}}
          value={user?.email ?? ""}
          disabled
          containerClassName="w-full"
        />

        <TextBox
          title="New Email Address"
          value={newEmail}
          setValue={(e) => setNewEmail(e)}
          containerClassName="w-full"
          disabled={isLoading || isSent}
        />
      </div>

      {error && <div className="text-error text-sm font-semibold">{error}</div>}

      <Button
        title={isLoading ? "Sending..." : "Change Email"}
        onClick={handleEmailChange}
        className="self-end w-36"
        disabled={isLoading || !regex.email.test(newEmail) || isSent}
      />
    </div>
  );
};

export default AdminChangeEmail;
