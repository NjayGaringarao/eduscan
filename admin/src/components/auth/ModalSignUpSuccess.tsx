"use client";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import Button from "../Button";
import { MailCheck } from "lucide-react";

interface IModalSignUpSuccess {
  open: boolean;
  onClose: () => void;
}

const ModalSignUpSuccess = ({ open, onClose }: IModalSignUpSuccess) => {
  return (
    <Transition appear show={open} as={Fragment}>
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
            <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-lg bg-background p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle
                as="h3"
                className="text-3xl font-semibold text-center md:text-start text-primary mb-2"
              >
                Verify your email
              </DialogTitle>
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col md:flex-row items-center justify-center md:center-start gap-4">
                  <MailCheck className="flex-1 w-44 h-44 text-primary" />

                  <p className="flex-2 text-lg text-center md:text-start text-textBody">
                    A verification link has been sent to your email address.
                    Please check your inbox to complete admin setup.
                  </p>
                </div>
                <Button title="Continue" onClick={onClose} className="w-full" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalSignUpSuccess;
