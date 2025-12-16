"use client";

import React from "react";
import {
  useScheduleEdit,
  useScheduleModal,
} from "@/contexts/schedule/useSchedule";
import type { ScheduleFormState as ContextScheduleFormState } from "@/contexts/schedule/ScheduleContext";
import Button from "@/components/Button";
import ScheduleForm from "@/components/schedule/ScheduleForm";
import BaseModal from "@/components/container/BaseModal";

const ModalEditSchedule = () => {
  const {
    selectedSchedule,
    scheduleForm,
    slots,
    isModified,
    isEditLoading,
    updateScheduleForm,
    updateSlots,
    resetForm,
    updateSchedule,
    closeEditModal,
  } = useScheduleEdit();

  const { isEditModalOpen } = useScheduleModal();

  // Wrapper functions to match ScheduleForm's expected prop types
  const setScheduleForm: React.Dispatch<
    React.SetStateAction<ContextScheduleFormState>
  > = (value) => {
    if (typeof value === "function") {
      updateScheduleForm(value(scheduleForm));
    } else {
      updateScheduleForm(value);
    }
  };

  const setSlots: React.Dispatch<React.SetStateAction<typeof slots>> = (
    value
  ) => {
    if (typeof value === "function") {
      updateSlots(value(slots));
    } else {
      updateSlots(value);
    }
  };

  if (!selectedSchedule) return null;

  const footer = (
    <div className="flex flex-row gap-4 justify-end border-t border-primary/20 py-4 px-6">
      <Button
        title={"Update Schedule"}
        className="w-42"
        disabled={isEditLoading || !isModified || !scheduleForm.name.trim()}
        onClick={updateSchedule}
      />
      <Button
        title="Reset"
        onClick={resetForm}
        secondary
        className="w-42"
        disabled={isEditLoading || !isModified}
      />
    </div>
  );

  return (
    <BaseModal
      isOpen={isEditModalOpen}
      onClose={closeEditModal}
      title={`Edit Schedule: ${selectedSchedule.name}`}
      panelClassName="max-w-6xl"
      contentClassName="p-6"
      footer={footer}
    >
      <ScheduleForm
        mode="EDIT"
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        slots={slots}
        setSlots={setSlots}
        isLoading={isEditLoading}
      />
    </BaseModal>
  );
};

export default ModalEditSchedule;
