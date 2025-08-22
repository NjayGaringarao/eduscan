"use client";

import React, { useState } from "react";
import Button from "../Button";
import ForgotPassword from "./ForgotPassword";
import { signIn } from "@/lib/auth/signIn";
import TextBox from "../TextBox";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const signInHandle = async () => {
    try {
      setIsLoading(true);
      const { error } = await signIn(email, password);

      if (error) {
        alert(error);
      }
    } catch (error) {
      console.log("components.auth.SignIn.signInHandle :: ", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <p className="bg-transparent pr-4 pl-2 py-1 border-b-2 border-primary text-primary text-3xl md:text-4xl font-semibold focus:outline-none focus:text-background focus:bg-textBody/80">
        Administrator
      </p>

      <TextBox
        title="Email"
        value={email}
        setValue={setEmail}
        containerClassName="flex-1"
      />
      <TextBox
        title="Password"
        value={password}
        setValue={setPassword}
        containerClassName="flex-1"
        isPassword
      />
      <Button
        title="Sign in"
        onClick={signInHandle}
        className="self-end w-full md:w-48"
        disabled={isLoading || password.length < 8}
      />

      <ForgotPassword email={email} />
    </>
  );
}
