"use client";

import React, { Suspense, useEffect, useState } from "react";
import TextBox from "@/components/TextBox";
import Button from "@/components/Button";
import ModalResetSuccess from "@/components/auth/ModalSignUpSuccess";
import Image from "next/image";
import { regex } from "@/constants/regex";
import { updatePassword } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";

const ResetPasswordContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [form, setForm] = useState({
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleReset = async () => {
    setIsLoading(true);
    const { error } = await updatePassword(form.password);

    if (error) {
      alert(error);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password.length > 256) {
      setError("Password must be less than 257 characters.");
      return;
    }
    if (!/[a-z]/.test(form.password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/\d/.test(form.password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!/[!@#$%^&*.,_]/.test(form.password)) {
      setError(
        "Password must contain at least one special character (!@#$%^&*.,_)."
      );
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
  }, [form]);

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    const validateLink = async () => {
      if (!token_hash || type !== "recovery") {
        router.replace("/");
      }
    };
    validateLink();
  }, [searchParams]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background">
      <Image
        src={"/image/prmsu-foreground.png"}
        alt="PRMSU Logo"
        width={1281}
        height={669}
        className="w-full h-full opacity-50 dark:opacity-20"
        style={{ objectFit: "cover" }}
      />
      <div className="absolute bg-background/30 dark:bg-background/50 backdrop-blur-md max-w-[40rem] w-full mx-8 md:mx-0 rounded-xl p-8 flex flex-col gap-4">
        <h2 className="text-primary text-3xl font-bold mb-2">Reset Password</h2>
        <TextBox
          title="New Password"
          value={form.password}
          setValue={(e) => setForm({ ...form, password: e })}
          containerClassName="w-full"
          isPassword
        />
        <TextBox
          title="Repeat New Password"
          value={form.confirm}
          setValue={(e) => setForm({ ...form, confirm: e })}
          containerClassName="w-full"
          isPassword
        />
        {error && (
          <div className="text-error text-sm font-semibold">{error}</div>
        )}
        <Button
          title="Reset Password"
          onClick={handleReset}
          className="self-end w-full md:w-48"
          disabled={
            isLoading ||
            !!!regex.password.test(form.password) ||
            form.password != form.confirm
          }
        />
        <p className="text-textBody">
          Please enter your new password. Make sure it is at least 8 characters
          long.
        </p>
        <ModalResetSuccess
          open={showSuccess}
          onClose={() => setShowSuccess(false)}
        />
      </div>
    </div>
  );
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
