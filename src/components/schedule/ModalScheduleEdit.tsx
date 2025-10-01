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
import { useScheduleEdit } from "@/contexts/schedule/useSchedule";
import Button from "../Button";
import ScheduleForm from "./ScheduleForm";

const ModalScheduleEdit = () => {
  const {
    selectedSchedule,
    scheduleForm,
    slots,
    isModified,
    isEditLoading,
    isActive,
    updateScheduleForm,
    updateSlots,
    resetForm,
    updateSchedule,
    toggleScheduleActive,
    closeScheduleModal,
  } = useScheduleEdit();

  const isOpen = !!selectedSchedule;

  // Wrapper functions to match ScheduleForm's expected prop types
  const setScheduleForm = (
    value: React.SetStateAction<typeof scheduleForm>
  ) => {
    if (typeof value === "function") {
      updateScheduleForm(value(scheduleForm));
    } else {
      updateScheduleForm(value);
    }
  };

  const setSlots = (value: React.SetStateAction<typeof slots>) => {
    if (typeof value === "function") {
      updateSlots(value(slots));
    } else {
      updateSlots(value);
    }
  };

  if (!selectedSchedule) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeScheduleModal}>
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
            <DialogPanel className="w-full max-w-6xl rounded-xl bg-secondary py-6 shadow-xl flex flex-col gap-6">
              {/* Header */}
              <div className="flex justify-between items-center px-6">
                <DialogTitle className="text-xl font-semibold text-primary">
                  Edit Schedule: {selectedSchedule.name}
                </DialogTitle>
                <button
                  onClick={closeScheduleModal}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                </button>
              </div>

              <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-6">
                <ScheduleForm
                  mode="EDIT"
                  scheduleForm={scheduleForm}
                  setScheduleForm={setScheduleForm}
                  slots={slots}
                  setSlots={setSlots}
                  isLoading={isEditLoading}
                  handleToggle={toggleScheduleActive}
                  isActive={isActive}
                />

                <div className="flex flex-row gap-4 justify-end pt-4 border-t border-primary/20">
                  <Button
                    title={isEditLoading ? "Updating..." : "Update Schedule"}
                    className="w-32"
                    disabled={
                      isEditLoading || !isModified || !scheduleForm.name.trim()
                    }
                    onClick={updateSchedule}
                  />
                  <Button
                    title="Reset"
                    onClick={resetForm}
                    secondary
                    className="w-32"
                    disabled={isEditLoading || !isModified}
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

export default ModalScheduleEdit;
