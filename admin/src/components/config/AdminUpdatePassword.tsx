"use client";
import React, { useEffect, useState } from "react";
import Button from "../Button";
import { resetPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@supabase/supabase-js";
import { cn } from "@/utils/style";
import Box from "../container/Box";

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
    <Box containerClassName={cn("flex flex-col gap-4 p-6")}>
      <div className="flex-1 flex flex-col">
        <p className="text-primary font-semibold text-xl">Update Password</p>
        <p className="text-textBody text-base mt-2">
          For security reasons, passwords cannot be displayed. To update your
          password, you will need to have an access in the admin account&apos;s
          registered email address. Secure link will be sent to that email in
          order to create new password.
        </p>
      </div>

      <Button
        onClick={handleSendEmail}
        title={isSent ? "Email Sent" : "Send Email"}
        disabled={isLoading || isSent || !user}
        className="w-36 self-end"
      />
    </Box>
  );
};

export default AdminUpdatePassword;
