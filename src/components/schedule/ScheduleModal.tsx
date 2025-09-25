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

import EditSchedule from "./EditSchedule";
import { useScheduleModal } from "@/contexts/schedule/useSchedule";
import { cn } from "@/utils/style";

const ScheduleModal: React.FC = () => {
  const { selectedSchedule, isModalOpen, closeScheduleModal } =
    useScheduleModal();

  return (
    <Transition show={isModalOpen} as={Fragment}>
      <Dialog onClose={closeScheduleModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
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
                "w-full max-w-6xl rounded-xl",
                "bg-secondary py-6 shadow-xl ",
                "flex flex-col gap-6"
              )}
            >
              <div className="flex justify-between items-center px-6">
                <DialogTitle className="text-xl font-semibold text-primary">
                  Schedule Details
                </DialogTitle>
                <button
                  onClick={closeScheduleModal}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                </button>
              </div>

              <div className="max-h-[80vh] flex flex-col gap-4 px-6 overflow-y-auto">
                {selectedSchedule && <EditSchedule />}

                {/* <div>
                  <p className="text-primary text-lg">
                    Users with this schedule
                  </p>
                  <div className="mt-2 max-h-48 overflow-y-auto border border-primary/30 rounded-md">
                    {users.length === 0 ? (
                      <p className="p-3 text-primary/70">None</p>
                    ) : (
                      <ul className="divide-y divide-primary/20">
                        {users.map((u) => (
                          <li key={u.user_id} className="p-2 text-primary/90">
                            {u.last_name}, {u.first_name} {u.middle_name ?? ""}{" "}
                            — {u.user_id}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div> */}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ScheduleModal;
