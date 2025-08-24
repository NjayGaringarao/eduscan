"use client";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import Button from "../Button";
import { Key } from "lucide-react";
import useDarkMode from "@/hooks/useDarkMode";
import ReCAPTCHA from "react-google-recaptcha";
import { cn } from "@/utils/style";
import { resetPassword } from "@/lib/auth";
import TextBox from "../TextBox";
import { regex } from "@/constants/regex";

interface IForgotPassword {
  email: string;
}

const ForgotPassword = ({ email }: IForgotPassword) => {
  const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
  const isDarkMode = useDarkMode();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [inputEmail, setInputEmail] = useState(email);

  const handleSend = async () => {
    setIsLoading(true);
    const { error } = await resetPassword(inputEmail, captchaToken!);
    if (error) {
      alert(error);
    } else {
      setIsOpen(false);
      alert("We've successfully sent the reset link. Please check your email.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) setInputEmail(email);
  }, [isOpen]);

  return (
    <>
      <button
        className="text-textBody hover:underline underline-offset-4 place-self-start"
        onClick={() => setIsOpen(true)}
      >
        Forgot Password?
      </button>
      {isOpen && (
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => {}}>
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            </TransitionChild>

            <div className="fixed inset-0 flex items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel
                  className={cn(
                    "w-full max-w-xl p-6 rounded-lg",
                    "bg-background overflow-hidden",
                    "text-left align-middle shadow-xl transform transition-all"
                  )}
                >
                  <DialogTitle
                    as="h3"
                    className="text-3xl font-semibold text-center md:text-start text-primary mb-8"
                  >
                    Reset Password
                  </DialogTitle>
                  <div className="flex flex-col items-center gap-8">
                    <div className="flex-1 flex flex-col items-start gap-4">
                      <div className="flex flex-row gap-4">
                        <Key className="w-36 h-36 text-primary" />

                        <div className="flex-1 flex flex-col gap-4">
                          <p className="text-lg text-center md:text-start text-textBody">
                            A reset link will be send to the provided email
                            address if it was correct and valid.
                          </p>
                          <TextBox
                            value={inputEmail}
                            setValue={setInputEmail}
                            containerClassName="w-full"
                          />
                        </div>
                      </div>

                      <div
                        className={cn(
                          !captchaToken && !!regex.email.test(inputEmail)
                            ? "visible"
                            : "hidden"
                        )}
                      >
                        <ReCAPTCHA
                          ref={recaptchaRef}
                          sitekey={SITE_KEY}
                          size="normal"
                          onChange={(captchaToken) =>
                            setCaptchaToken(captchaToken)
                          }
                          onExpired={() => setCaptchaToken(null)}
                          theme={isDarkMode ? "dark" : "light"}
                        />
                      </div>
                    </div>
                    <div className="w-full flex flex-col md:flex-row gap-2">
                      <Button
                        title="Send"
                        onClick={handleSend}
                        className="flex-1"
                        disabled={
                          isLoading ||
                          !captchaToken ||
                          !regex.email.test(inputEmail)
                        }
                      />
                      <Button
                        title="Cancel"
                        onClick={() => setIsOpen(false)}
                        className="flex-1"
                        disabled={isLoading}
                        secondary
                      />
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </Dialog>
        </Transition>
      )}
    </>
  );
};

export default ForgotPassword;
