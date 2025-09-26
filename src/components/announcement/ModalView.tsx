"use client";

import React, { Fragment } from "react";
import { Announcement } from "@/models";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X, Calendar, Users } from "lucide-react";

interface IModalView {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

const ModalView = ({ isOpen, onClose, announcement }: IModalView) => {
  if (!announcement) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRecipientText = (recipient: string) => {
    switch (recipient) {
      case "ALL":
        return "All Users";
      case "GUARDIAN":
        return "Guardians Only";
      case "EMPLOYEE":
        return "Employees Only";
      default:
        return recipient;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
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
            <DialogPanel className="w-full max-w-4xl rounded-xl bg-secondary py-6 shadow-xl flex flex-col gap-6">
              {/* Header */}
              <div className="flex justify-between items-center px-6">
                <DialogTitle className="text-xl font-semibold text-primary">
                  Announcement Details
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                </button>
              </div>

              <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-6">
                {/* Title */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold text-primary">Title</h3>
                  <p className="text-base text-textBody bg-background/50 p-3 rounded-md">
                    {announcement.title}
                  </p>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold text-primary">
                    Message
                  </h3>
                  <div className="bg-background/50 p-4 rounded-md min-h-[120px]">
                    <p className="text-base text-textBody whitespace-pre-wrap">
                      {announcement.message}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recipient */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-primary">
                        Recipient
                      </h3>
                    </div>
                    <p className="text-base text-textBody bg-background/50 p-3 rounded-md">
                      {getRecipientText(announcement.recipient)}
                    </p>
                  </div>

                  {/* Created At */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-primary">
                        Created At
                      </h3>
                    </div>
                    <p className="text-base text-textBody bg-background/50 p-3 rounded-md">
                      {formatDate(announcement.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalView;
