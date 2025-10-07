"use client";

import { useEffect, useState } from "react";
import { Schedule, User } from "@/models";
import { Edit, Trash } from "lucide-react";
import * as scheduleLib from "@/lib/schedule";
import { useScheduleModal } from "@/contexts/schedule/useSchedule";
import ScheduleInfo from "@/components/schedule/ScheduleInfo";
import UserList from "@/components/schedule/UserList";
import Button from "@/components/Button";
import BaseModal from "@/components/ui/BaseModal";

interface IModalSchedule {
  onRefresh: () => void;
}

const ModalSchedule = ({ onRefresh }: IModalSchedule) => {
  const [fullSchedule, setFullSchedule] = useState<
    (Schedule & { users: User[] }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedSchedule, isViewModalOpen, closeViewModal, openEditModal } =
    useScheduleModal();

  const fetchScheduleDetails = async () => {
    if (!selectedSchedule) return;

    setIsLoading(true);
    // Use the schedule data that's already loaded in context
    setFullSchedule(selectedSchedule as Schedule & { users: User[] });
    setIsLoading(false);
  };

  const handleEdit = () => {
    if (fullSchedule) {
      openEditModal(fullSchedule);
    }
  };

  const handleDeleteSchedule = async () => {
    if (
      !confirm(
        `Confirm Delete: Are you sure you want to delete the schedule "${fullSchedule?.name}"? This action cannot be undone.`
      ) ||
      !fullSchedule
    ) {
      return;
    }

    const { error } = await scheduleLib.deleteSchedule(
      fullSchedule.schedule_id
    );
    if (error) {
      alert(`Error deleting schedule: ${error}`);
    } else {
      alert("Schedule deleted successfully!");
      onRefresh();
      closeViewModal();
    }
  };

  const handleClose = (isRefresh?: boolean) => {
    if (isRefresh) {
      onRefresh();
    }
    closeViewModal();
  };

  useEffect(() => {
    if (selectedSchedule && isViewModalOpen) {
      fetchScheduleDetails();
    } else {
      setFullSchedule(null);
    }
  }, [selectedSchedule, isViewModalOpen]);

  if (!fullSchedule) return null;

  const footer = (
    <div className="self-end flex flex-row gap-2 px-6">
      <Button onClick={handleEdit} className="w-32" secondary>
        <Edit className="h-6 w-6" /> Edit
      </Button>
      <Button
        className="border-uRed text-uRed w-32"
        onClick={handleDeleteSchedule}
        secondary
      >
        <Trash className="h-6 w-6" /> Delete
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isViewModalOpen}
      onClose={handleClose}
      title={`${fullSchedule.name} - Schedule Information`}
      panelClassName="w-full max-w-[100rem]"
      contentClassName="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-6 max-h-[95vh] px-6"
      footer={footer}
    >
      <UserList schedule={fullSchedule} onRefresh={onRefresh} />
      <ScheduleInfo schedule={fullSchedule} isLoading={isLoading} />
    </BaseModal>
  );
};

export default ModalSchedule;
