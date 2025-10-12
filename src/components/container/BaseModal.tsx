"use client";

import React, { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X } from "lucide-react";
import { cn } from "@/utils/style";

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  panelClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  disableBackdropClick?: boolean;
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  footer,
  panelClassName,
  contentClassName,
  headerClassName,
  disableBackdropClick = false,
}) => {
  const handleClose = () => {
    if (!disableBackdropClick) {
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Overlay */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={cn("fixed inset-0 bg-black/40 backdrop-blur-xs")} />
        </TransitionChild>

        {/* Centered panel */}
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
                "w-full rounded-xl bg-secondary shadow-xl flex flex-col",
                "max-w-md overflow-hidden",
                panelClassName
              )}
            >
              {/* Header */}
              <div
                className={cn(
                  "flex justify-between items-center px-6",
                  "border-b border-textBody/60 py-4 bg-primary/10",
                  headerClassName
                )}
              >
                <DialogTitle className="text-xl font-semibold text-primary">
                  {title}
                </DialogTitle>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-md hover:bg-gray-100 transition"
                  >
                    <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                  </button>
                )}
              </div>

              {/* Child */}
              <div
                className={cn(
                  "flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden",
                  contentClassName
                )}
              >
                {children}
              </div>

              {/* Footer */}
              {footer ? footer : null}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default BaseModal;
