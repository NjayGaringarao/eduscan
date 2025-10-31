"use client";

import React from "react";
import { Announcement } from "@/models";
import { Calendar, Users } from "lucide-react";
import BaseModal from "../container/BaseModal";

interface IModalView {
  onClose: () => void;
  announcement: Announcement | null;
}

const ModalView = ({ onClose, announcement }: IModalView) => {
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
    <BaseModal
      isOpen={!!announcement}
      onClose={onClose}
      title="Announcement Details"
      panelClassName="max-w-2xl"
      contentClassName="py-4"
    >
      <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-6">
        {/* Title */}
        <div className="flex flex-row gap-4 items-center">
          <h3 className="text-base font-semibold text-primary">Title</h3>
          <p className="w-full text-base text-primary bg-background/50 p-2 border border-primary/20 rounded-md">
            {announcement?.title}
          </p>
        </div>

        {/* Message */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-primary">Message</h3>
          <p className="w-full min-h-52 text-base text-primary bg-background/50 p-2 border border-primary/20 rounded-md">
            {announcement?.message}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Recipient */}
          <div className="flex flex-row gap-2 items-center">
            <h3 className="text-base font-semibold text-primary">Recipient</h3>
            <p className="w-full text-base text-primary bg-background/50 p-2 border border-primary/20 rounded-md">
              {announcement ? getRecipientText(announcement.recipient) : ""}
            </p>
          </div>

          {/* Created At */}

          <div className="flex flex-row items-center gap-2">
            <h3 className="text-base font-semibold text-primary w-28">
              Created At
            </h3>
            <p className="w-full text-base text-primary bg-background/50 p-2 border border-primary/20 rounded-md">
              {announcement ? formatDate(announcement.created_at) : ""}
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default ModalView;
