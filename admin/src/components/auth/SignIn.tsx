"use client";

import React, { useState } from "react";
import Button from "../Button";
import ForgotPassword from "./ForgotPassword";
import { signIn } from "@/lib/auth/signIn";
import TextBox from "../TextBox";
import { cn } from "@/utils/style";

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
      <p
        className={cn(
          "text-primary/80 text-3xl md:text-4xl font-semibold focus:text-background focus:bg-textBody/80"
        )}
      >
        Admin Console
      </p>

      <div className="grid grid-cols-2 gap-4">
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
      </div>
      <Button
        title="Sign in"
        onClick={signInHandle}
        className="self-end w-full md:w-48 py-2"
        disabled={isLoading || password.length < 8}
      />

      <ForgotPassword email={email} />
    </>
  );
}
