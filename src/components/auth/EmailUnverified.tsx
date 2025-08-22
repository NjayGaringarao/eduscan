"use client";

import { MailWarning } from "lucide-react";
import Button from "../Button";

export const EmailUnverified = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col md:flex-row items-center justify-center md:center-start gap-4">
        <MailWarning className="flex-1 w-44 h-44 text-primary hidden md:block" />

        <div className="flex flex-col flex-2 gap-2">
          <h2 className="text-primary text-xl">EMAIL NOT VERIFIED</h2>
          <p className=" text-lg text-center md:text-start text-textBody">
            A verification link has been sent to your email address. Please
            check your inbox to complete admin setup.
          </p>
        </div>
      </div>
      <Button
        title="Check Verification Status"
        onClick={() => window.location.reload()}
        className="w-full"
      />
    </div>
  );
};
