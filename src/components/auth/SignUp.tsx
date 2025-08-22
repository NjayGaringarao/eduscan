"use client";

import React, { useEffect, useRef, useState } from "react";
import Button from "../Button";
import { initializeAdmin } from "@/lib/auth";
import ModalSignUpSuccess from "./ModalSignUpSuccess";
import { regex } from "@/constants/regex";
import useDarkMode from "@/hooks/useDarkMode";
import ReCAPTCHA from "react-google-recaptcha";
import TextBox from "../TextBox";

type ErrorType = {
  type: "email" | "password" | "conPass" | null;
  message: string | null;
};

export function SignUp() {
  const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const isDarkMode = useDarkMode();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    conPassword: "",
  });
  const [error, setError] = useState<ErrorType>({ type: null, message: null });
  const [showSuccess, setShowSuccess] = useState(false);

  const signUpHandle = async () => {
    setIsLoading(true);
    const { error } = await initializeAdmin(
      form.email,
      form.password,
      captchaToken!
    );
    setIsLoading(false);
    if (error) {
      alert(`${error}`);
      return;
    }
    setShowSuccess(true);
  };

  useEffect(() => {
    setError({ type: null, message: null });
    if (!regex.email.test(form.email)) {
      setError({
        type: "email",
        message: "Email should be a valid email address.",
      });
      return;
    }
    if (form.password.length < 8) {
      setError({
        type: "password",
        message: "Password must be at least 8 characters.",
      });
      return;
    }
    if (form.password.length > 256) {
      setError({
        type: "password",
        message: "Password must be less than 257 characters.",
      });
      return;
    }
    if (!/[a-z]/.test(form.password)) {
      setError({
        type: "password",
        message: "Password must contain at least one lowercase letter.",
      });
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError({
        type: "password",
        message: "Password must contain at least one uppercase letter.",
      });
      return;
    }
    if (!/\d/.test(form.password)) {
      setError({
        type: "password",
        message: "Password must contain at least one number.",
      });
      return;
    }
    if (!/[!@#$%^&*.,_]/.test(form.password)) {
      setError({
        type: "password",
        message:
          "Password must contain at least one special character (!@#$%^&*.,_).",
      });
      return;
    }
    if (form.password !== form.conPassword) {
      setError({ type: "conPass", message: "Passwords do not match." });
      return;
    }
  }, [form]);

  useEffect(() => {
    if (captchaToken)
      document.getElementById("bottom")?.scrollIntoView({ behavior: "smooth" });
  }, [captchaToken]);

  return (
    <>
      <h2 className="text-primary text-3xl md:text-4xl font-bold mb-2">
        Initialize Admin
      </h2>
      <div
        className="flex flex-col gap-4 overflow-y-auto  max-h-[40vh] overflow-x-hidden pr-4"
        style={{
          scrollbarColor: "rgba(100,100,100,0.1) var(--color-background)",
          scrollbarWidth: "thin",
        }}
      >
        <TextBox
          title="Email"
          value={form.email}
          setValue={(e) => setForm({ ...form, email: e })}
          containerClassName="w-full"
        />
        {error.type == "email" && (
          <div className="text-error text-sm font-semibold -mt-2 -mb-2">
            {error.message}
          </div>
        )}
        <TextBox
          title="Password"
          value={form.password}
          setValue={(e) => setForm({ ...form, password: e })}
          containerClassName="w-full"
          isPassword
        />
        {error.type == "password" && (
          <div className="text-error text-sm font-semibold -mt-2 -mb-2">
            {error.message}
          </div>
        )}
        <TextBox
          title="Repeat Password"
          value={form.conPassword}
          setValue={(e) => setForm({ ...form, conPassword: e })}
          containerClassName="w-full"
          isPassword
        />
        {error.type == "conPass" && (
          <div className="text-error text-sm font-semibold -mt-2 -mb-2">
            {error.message}
          </div>
        )}

        <div
          className={`${
            !captchaToken &&
            !isLoading &&
            regex.email.test(form.email) &&
            regex.password.test(form.password) &&
            form.password == form.conPassword
              ? "visible"
              : "hidden"
          }`}
        >
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={SITE_KEY}
            size="normal"
            onChange={(captchaToken) => setCaptchaToken(captchaToken)}
            onExpired={() => setCaptchaToken(null)}
            theme={isDarkMode ? "dark" : "light"}
          />
        </div>

        <p className="text-textBody">
          This form is used to initialize the security of Eduscan by creating
          the only admin account. Please make sure to use an authorized email
          address and strong password.
        </p>
        <Button
          title="Initialize"
          onClick={signUpHandle}
          className="self-end w-full md:w-48"
          disabled={
            !captchaToken ||
            isLoading ||
            !regex.email.test(form.email) ||
            !regex.password.test(form.password) ||
            form.password != form.conPassword
          }
        />
        <div id="bottom" />

        <ModalSignUpSuccess
          open={showSuccess}
          onClose={() => {
            setShowSuccess(false);
            window.location.reload();
          }}
        />
      </div>
    </>
  );
}
