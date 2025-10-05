"use client";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { Schedule, User } from "@/models";
import { Edit, Trash, X } from "lucide-react";
import * as scheduleLib from "@/lib/schedule";
import { useScheduleList } from "@/contexts/schedule/useSchedule";
import ScheduleInfo from "./ScheduleInfo";
import UserList from "./UserList";
import Button from "../Button";

interface IModalSchedule {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onRefresh: () => void;
}

const ModalSchedule = ({
  isOpen,
  onClose,
  schedule,
  onRefresh,
}: IModalSchedule) => {
  const [fullSchedule, setFullSchedule] = useState<
    (Schedule & { users: User[] }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const { openScheduleModal } = useScheduleList();

  const fetchScheduleDetails = async () => {
    if (!schedule) return;

    setIsLoading(true);
    const { schedule: fetchedSchedule, error } = await scheduleLib.getById(
      schedule.schedule_id
    );
    if (error) {
      console.error("Error fetching schedule details:", error);
    } else {
      setFullSchedule(fetchedSchedule);
    }
    setIsLoading(false);
  };

  const handleEdit = () => {
    if (fullSchedule) {
      openScheduleModal(fullSchedule);
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
      onClose();
    }
  };

  const handleClose = (isRefresh?: boolean) => {
    if (isRefresh) {
      onRefresh();
    }
    onClose();
  };

  useEffect(() => {
    if (schedule && isOpen) {
      fetchScheduleDetails();
    } else {
      setFullSchedule(null);
    }
  }, [schedule, isOpen]);

  if (!fullSchedule) return null;

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
            <DialogPanel className="w-full max-w-[100rem] rounded-xl bg-secondary py-6 shadow-xl flex flex-col gap-6">
              {/* Header */}
              <div className="flex justify-between items-center px-6">
                <DialogTitle className="text-xl font-semibold text-primary">
                  {fullSchedule.name} - Schedule Information
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                </button>
              </div>

              <div className="flex flex-col-reverse lg:flex-row gap-6 max-h-[95vh] overflow-y-auto overflow-x-hidden px-6">
                <UserList schedule={fullSchedule} onRefresh={onRefresh} />
                <ScheduleInfo
                  schedule={fullSchedule}
                  isLoading={isLoading}
                  onClose={handleClose}
                />
              </div>

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
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalSchedule;
