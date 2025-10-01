"use client";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { Schedule } from "@/models";
import { X, Calendar, Clock, Users, Edit, Trash2 } from "lucide-react";
import * as scheduleLib from "@/lib/schedule";
import { useScheduleList } from "@/contexts/schedule/useSchedule";

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
  const [fullSchedule, setFullSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    if (schedule) {
      openScheduleModal(schedule);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the schedule "${schedule.name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    const { error } = await scheduleLib.deleteSchedule(schedule.schedule_id);

    if (error) {
      alert(`Error deleting schedule: ${error}`);
    } else {
      alert("Schedule deleted successfully!");
      onRefresh();
      onClose();
    }

    setIsDeleting(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeSlot = (slot: any) => {
    if (slot.span) {
      const start = slot.span.start;
      const end = slot.span.end;
      const startTime = `${start.hour
        .toString()
        .padStart(2, "0")}:${start.minute.toString().padStart(2, "0")}`;
      const endTime = `${end.hour.toString().padStart(2, "0")}:${end.minute
        .toString()
        .padStart(2, "0")}`;
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const startDay = dayNames[start.day];
      const endDay = start.day !== end.day ? ` - ${dayNames[end.day]}` : "";
      return `${startDay}${endDay}: ${startTime} - ${endTime}`;
    }

    // Legacy format
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = dayNames[slot.day_of_week || 0];
    const startTime = slot.start_time || "08:00:00";
    const endTime = slot.end_time || "09:00:00";
    return `${dayName}: ${startTime.substring(0, 5)} - ${endTime.substring(
      0,
      5
    )}`;
  };

  useEffect(() => {
    if (schedule && isOpen) {
      fetchScheduleDetails();
    } else {
      setFullSchedule(null);
    }
  }, [schedule, isOpen]);

  if (!schedule) return null;

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
            <DialogPanel className="w-full max-w-4xl rounded-xl bg-secondary py-6 shadow-xl flex flex-col gap-6">
              {/* Header */}
              <div className="flex justify-between items-center px-6">
                <DialogTitle className="text-xl font-semibold text-primary">
                  Schedule Information
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                </button>
              </div>

              <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-primary">
                            Name
                          </h3>
                        </div>
                        <p className="text-base text-textBody bg-background/50 p-3 rounded-md">
                          {schedule.name}
                        </p>
                      </div>

                      {/* User Type */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-primary">
                            User Type
                          </h3>
                        </div>
                        <p className="text-base text-textBody bg-background/50 p-3 rounded-md">
                          {schedule.user_type}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-semibold text-primary">
                        Description
                      </h3>
                      <div className="bg-background/50 p-4 rounded-md min-h-[80px]">
                        <p className="text-base text-textBody whitespace-pre-wrap">
                          {schedule.description || "No description provided"}
                        </p>
                      </div>
                    </div>

                    {/* Status and Created At */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Status */}
                      <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-semibold text-primary">
                          Status
                        </h3>
                        <span
                          className={`px-3 py-2 rounded-full text-sm font-medium w-fit ${
                            schedule.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {schedule.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* Created At */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-primary">
                            Created At
                          </h3>
                        </div>
                        <p className="text-base text-textBody bg-background/50 p-3 rounded-md">
                          {formatDate(schedule.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Time Slots */}
                    {fullSchedule?.slots && fullSchedule.slots.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-semibold text-primary">
                          Time Slots
                        </h3>
                        <div className="bg-background/50 p-4 rounded-md max-h-40 overflow-y-auto">
                          <div className="space-y-2">
                            {fullSchedule.slots.map((slot, index) => (
                              <div
                                key={index}
                                className="text-sm text-textBody"
                              >
                                {formatTimeSlot(slot)}
                                {slot.label && (
                                  <span className="ml-2 text-primary/70">
                                    ({slot.label})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-row gap-4 justify-end pt-4 border-t border-primary/20">
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Schedule
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? "Deleting..." : "Delete Schedule"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalSchedule;
