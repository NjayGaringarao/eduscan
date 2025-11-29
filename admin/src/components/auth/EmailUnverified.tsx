"use client";

import { MailWarning } from "lucide-react";
import Button from "../Button";

export const EmailUnverified = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col md:flex-row items-center justify-center md:center-start gap-4">
        <MailWarning className="w-32 h-32 text-primary hidden md:block" />

        <div className="flex flex-col flex-2 gap-2">
          <div className="flex flex-row gap-2 items-center">
            <MailWarning className="w-12 h-12 text-primary block md:hidden" />
            <h2 className="flex-1 text-primary text-2xl font-semibold">
              EMAIL NOT VERIFIED
            </h2>
          </div>
          <p className="text-lg text-start text-textBody">
            A verification link has been sent to your email address. Please
            check your inbox to complete admin setup.
          </p>
        </div>
      </div>
      <Button
        title="Check Verification Status"
        onClick={() => window.location.reload()}
        className="w-full py-2 md:w-auto md:self-end"
      />
    </div>
  );
};
