"use client";

import React, { Fragment, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X } from "lucide-react";
import { createSchedule } from "@/lib/schedule";
import { Slot } from "@/models";
import Button from "../Button";
import ScheduleForm from "./ScheduleForm";

interface IModalScheduleCreate {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const ModalScheduleCreate = ({
  isOpen,
  onClose,
  onRefresh,
}: IModalScheduleCreate) => {
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    description: "",
    user_type: "STUDENT" as "STUDENT" | "EMPLOYEE",
  });
  const [slots, setSlots] = useState<Slot[]>([]);

  const clearHandle = () => {
    setScheduleForm({ name: "", description: "", user_type: "STUDENT" });
    setSlots([]);
  };

  const createHandle = async () => {
    if (!scheduleForm.name.trim()) {
      alert("Please enter a schedule name.");
      return;
    }

    if (!confirm("This will create a new schedule.")) return;
    setIsLoading(true);

    // Convert slots to the format expected by the server
    const serverSlots = slots.map((slot) => {
      return {
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        label: slot.label || null,
      };
    });

    try {
      const { error } = await createSchedule({
        name: scheduleForm.name,
        description: scheduleForm.description || null,
        user_type: scheduleForm.user_type,
        slots: serverSlots,
      });

      if (error) {
        alert(`Error creating schedule: ${error}`);
      } else {
        alert("✅ Schedule created successfully!");
        clearHandle();
        onRefresh();
        onClose();
      }
    } catch (err) {
      alert("Failed to create schedule");
      console.error("Error creating schedule:", err);
    } finally {
      setIsLoading(false);
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
            <DialogPanel className="w-full max-w-6xl rounded-xl bg-background py-6 shadow-xl flex flex-col gap-6">
              {/* Header */}
              <div className="flex justify-between items-center px-6">
                <DialogTitle className="text-xl font-semibold text-primary">
                  Create Schedule
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                </button>
              </div>

              <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-6">
                <ScheduleForm
                  mode="CREATE"
                  scheduleForm={scheduleForm}
                  setScheduleForm={setScheduleForm}
                  slots={slots}
                  setSlots={setSlots}
                  isLoading={isLoading}
                />

                <div className="flex flex-row gap-4 justify-end pt-4 border-t border-primary/20">
                  <Button
                    title="Create"
                    className="w-32"
                    disabled={isLoading || !scheduleForm.name.trim()}
                    onClick={createHandle}
                  />
                  <Button
                    title="Clear"
                    onClick={clearHandle}
                    secondary
                    className="w-32"
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

export default ModalScheduleCreate;
