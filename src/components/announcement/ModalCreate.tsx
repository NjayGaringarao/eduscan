"use client";

import React, { Fragment, useState } from "react";
import TextBox from "../TextBox";
import Select from "../Select";
import ParagraphBox from "../ParagraphBox";
import Button from "../Button";
import * as announcement from "@/lib/announcement";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X } from "lucide-react";

type AnnouncementForm = {
  title: string;
  message: string;
  recipient: string;
};

const DEFAULT_ANNOUNCEMENT = {
  title: "",
  message: "",
  recipient: "ALL",
};

interface IModalCreate {
  isOpen: boolean;
  onClose: () => void;
  handleRefreshList: () => Promise<void>;
}

const ModalCreate = ({ isOpen, onClose, handleRefreshList }: IModalCreate) => {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<AnnouncementForm>(DEFAULT_ANNOUNCEMENT);

  const handleClear = () => setForm(DEFAULT_ANNOUNCEMENT);

  const handleSend = async () => {
    if (!form.title || !form.message) return;

    const confirmSend = window.confirm(
      `Send this announcement to ${form.recipient}?`
    );
    if (!confirmSend) return;

    setIsLoading(true);
    const { error } = await announcement.create(form);

    if (error) {
      alert(error);
    } else {
      alert("Announcement sent successfully!");
      handleClear();
      handleRefreshList();
      onClose();
    }

    setIsLoading(false);
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
            <DialogPanel className="w-full max-w-5xl rounded-xl bg-secondary py-6 shadow-xl flex flex-col gap-6 ">
              {/* Header */}
              <div className="flex justify-between items-center px-6">
                <DialogTitle className="text-xl font-semibold text-primary">
                  Create Announcement
                </DialogTitle>
                <button
                  onClick={() => onClose()}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                </button>
              </div>

              <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-6">
                <div className="flex flex-row gap-4">
                  <TextBox
                    title="Title"
                    placeHolder="25 characters max"
                    value={form.title}
                    setValue={(e) => setForm((prev) => ({ ...prev, title: e }))}
                    containerClassName="flex-1"
                    disabled={isLoading}
                    maxLength={25}
                  />
                  <div className="flex flex-col">
                    <p className="text-base text-textBody">Recipient</p>
                    <Select
                      value={form.recipient}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          recipient: e.target.value,
                        }))
                      }
                      className="text-lg text-primary bg-background/50"
                      title="Recipient"
                      disabled={isLoading}
                    >
                      <option value="ALL">ALL USER</option>
                      <option value="GUARDIAN">GUARDIAN</option>
                      <option value="EMPLOYEE">EMPLOYEE</option>
                    </Select>
                  </div>
                </div>

                <ParagraphBox
                  title="Message"
                  placeholder="480 characters max"
                  value={form.message}
                  setValue={(e) => setForm((prev) => ({ ...prev, message: e }))}
                  containerClassName="col-span-3"
                  inputClassName="h-32"
                  disabled={isLoading}
                  maxLength={480}
                />
                <div className="col-span-3 flex flex-row gap-4 justify-end">
                  <Button
                    title={isLoading ? "Sending..." : "Send"}
                    className="w-28"
                    disabled={
                      isLoading || !form.message.length || !form.title.length
                    }
                    onClick={handleSend}
                  />
                  <Button
                    title="Clear"
                    onClick={handleClear}
                    secondary
                    className="w-28"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalCreate;
