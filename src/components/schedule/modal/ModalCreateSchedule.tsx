"use client";

import React, { useState } from "react";
import { createSchedule } from "@/lib/schedule";
import { Slot } from "@/models";
import Button from "@/components/Button";
import ScheduleForm from "@/components/schedule/ScheduleForm";
import BaseModal from "@/components/container/BaseModal";
import { useScheduleModal } from "@/contexts/schedule/useSchedule";

interface IModalScheduleCreate {
  onRefresh: () => void;
}

const ModalCreateSchedule = ({ onRefresh }: IModalScheduleCreate) => {
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    description: "",
    user_type: "STUDENT" as "STUDENT" | "EMPLOYEE",
  });
  const [slots, setSlots] = useState<Slot[]>([]);

  const { isCreateModalOpen, closeCreateModal } = useScheduleModal();

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
        clearHandle();
        onRefresh();
        closeCreateModal();
      }
    } catch (err) {
      alert("Failed to create schedule");
      console.error("Error creating schedule:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="flex flex-row gap-4 justify-end border-t border-primary/20 py-4 px-6">
      <Button
        title="Create"
        className="w-32"
        disabled={
          isLoading ||
          !scheduleForm.name.trim() ||
          scheduleForm.name.length < 3 ||
          slots.length === 0
        }
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
  );

  return (
    <BaseModal
      isOpen={isCreateModalOpen}
      onClose={() => {
        closeCreateModal();
        clearHandle();
      }}
      title="Create Schedule"
      panelClassName="max-w-6xl bg-background"
      contentClassName="p-6"
      footer={footer}
    >
      <ScheduleForm
        mode="CREATE"
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        slots={slots}
        setSlots={setSlots}
        isLoading={isLoading}
      />
    </BaseModal>
  );
};

export default ModalCreateSchedule;
