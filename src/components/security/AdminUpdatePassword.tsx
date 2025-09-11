"use client";

import { cn } from "@/utils/style";
import React, { useEffect, useState } from "react";
import Button from "../Button";
import { resetPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@supabase/supabase-js";

const AdminUpdatePassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const initialize = async () => {
    try {
      const user = await getCurrentUser();

      if (user) {
        setUser(user);
      } else {
        alert("No admin email found.");
      }
    } catch {
      alert("Failed to fetch admin email.");
    }
  };

  const handleSendEmail = async () => {
    if (
      !confirm(
        `Are you sure you want to send the password reset to ${user?.email!}?`
      )
    ) {
      return;
    }
    setIsLoading(true);

    try {
      const { error } = await resetPassword(user?.email!, user);

      if (error) {
        alert(error);
      } else {
        setIsSent(true);
      }
    } catch {
      alert("Unexpected error while sending reset email.");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    initialize();
  }, []);

  return (
    <div
      className={cn(
        "relative w-full rounded-xl p-6",
        "bg-background/70 backdrop-blur-lg border border-primary/20",
        "flex flex-col items-center gap-6"
      )}
    >
      <div className="flex-1 flex flex-col">
        <p className="text-primary font-semibold text-xl">Update Password</p>
        <p className="text-textBody text-base mt-2">
          For security reasons, passwords cannot be displayed. To update your
          password, you will need access to the admin account&apos;s registered
          email address. We will send a secure link to that email to complete
          the update.
        </p>
      </div>

      <Button
        onClick={handleSendEmail}
        title={isSent ? "Email Sent" : "Send Email"}
        disabled={isLoading || isSent || !user}
        className="w-36 self-end"
      />
    </div>
  );
};

export default AdminUpdatePassword;
