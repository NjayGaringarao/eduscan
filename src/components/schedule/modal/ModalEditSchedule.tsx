"use client";

import React from "react";
import {
  useScheduleEdit,
  useScheduleModal,
} from "@/contexts/schedule/useSchedule";
import Button from "@/components/Button";
import ScheduleForm from "@/components/schedule/ScheduleForm";
import BaseModal from "@/components/ui/BaseModal";

const ModalEditSchedule = () => {
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
    closeEditModal,
  } = useScheduleEdit();

  const { isEditModalOpen } = useScheduleModal();

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

  const footer = (
    <div className="flex flex-row gap-4 justify-end pt-4 border-t border-primary/20 px-6">
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
      footer={footer}
    >
      <ScheduleForm
        mode="EDIT"
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        slots={slots}
        setSlots={setSlots}
        isLoading={isEditLoading}
        isActive={isActive}
      />
    </BaseModal>
  );
};

export default ModalEditSchedule;
