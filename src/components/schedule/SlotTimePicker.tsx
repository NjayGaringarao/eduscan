"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import { cn } from "@/utils/style";
import Button from "../Button";
import { AlertTriangleIcon, X } from "lucide-react";

interface SlotTimePickerProps {
  value: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    label?: string;
  } | null;
  onChange: (slot: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    label?: string;
  }) => void;
  disabled?: boolean;
  disabledSlots?: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
  className?: string;
  containerClassName?: string;
  stepMinutes?: number;
  isOpen: boolean;
  onClose: () => void;
  user_type?: "STUDENT" | "EMPLOYEE";
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const formatTime = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  let h12 = hour % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${minute.toString().padStart(2, "0")} ${period}`;
};

const toMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const fromMinutes = (totalMinutes: number) => {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
};

const isValidTimeSlot = (start: string, end: string): boolean => {
  return toMinutes(end) > toMinutes(start);
};

const slotsOverlap = (
  slot1: { day_of_week: number; start_time: string; end_time: string },
  slot2: { day_of_week: number; start_time: string; end_time: string }
): boolean => {
  if (slot1.day_of_week !== slot2.day_of_week) return false;

  const start1 = toMinutes(slot1.start_time);
  const end1 = toMinutes(slot1.end_time);
  const start2 = toMinutes(slot2.start_time);
  const end2 = toMinutes(slot2.end_time);

  return !(end1 <= start2 || end2 <= start1);
};

const SlotTimePicker: React.FC<SlotTimePickerProps> = ({
  value,
  onChange,
  disabledSlots = [],
  stepMinutes = 15,
  isOpen,
  onClose,
  user_type = "STUDENT",
}) => {
  // For EMPLOYEE, lock the day to the value from props (don't allow changes)
  // For STUDENT, allow day selection
  const [tempDay, setTempDay] = useState<number>(value?.day_of_week ?? 0);
  const [tempStartTime, setTempStartTime] = useState<string>(
    value?.start_time ?? "08:00"
  );
  const [tempEndTime, setTempEndTime] = useState<string>(
    value?.end_time ?? "09:00"
  );

  // When user_type is EMPLOYEE, keep day locked to value
  useEffect(() => {
    if (user_type === "EMPLOYEE" && value?.day_of_week !== undefined) {
      setTempDay(value.day_of_week);
    }
  }, [value?.day_of_week, user_type]);

  // Refs for scrolling
  const startHourRef = useRef<HTMLDivElement>(null);
  const startMinuteRef = useRef<HTMLDivElement>(null);
  const startPeriodRef = useRef<HTMLDivElement>(null);
  const endHourRef = useRef<HTMLDivElement>(null);
  const endMinuteRef = useRef<HTMLDivElement>(null);
  const endPeriodRef = useRef<HTMLDivElement>(null);

  // Ensure we have valid time formats
  const safeStartTime = tempStartTime.includes(":") ? tempStartTime : "08:00";
  const safeEndTime = tempEndTime.includes(":") ? tempEndTime : "09:00";

  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = useMemo(
    () => Array.from({ length: 60 / stepMinutes }, (_, i) => i * stepMinutes),
    [stepMinutes]
  );
  const periods = ["AM", "PM"] as const;

  const to12Hour = (time24: string) => {
    const timeParts = time24.split(":");
    const hour = parseInt(timeParts[0] || "8", 10);
    const minute = parseInt(timeParts[1] || "0", 10);
    if (hour === 0) return { hour: 12, period: "AM" as const, minute };
    if (hour < 12) return { hour, period: "AM" as const, minute };
    if (hour === 12) return { hour: 12, period: "PM" as const, minute };
    return { hour: hour - 12, period: "PM" as const, minute };
  };

  const to24Hour = (hour12: number, period: "AM" | "PM", minute: number) => {
    let hour24 = hour12;
    if (period === "AM" && hour12 === 12) hour24 = 0;
    else if (period === "PM" && hour12 !== 12) hour24 = hour12 + 12;
    return `${hour24.toString().padStart(2, "0")}:${(minute || 0)
      .toString()
      .padStart(2, "0")}`;
  };

  // Check for overlaps (but don't disable selection)
  const hasOverlap = (day: number, start: string, end: string): boolean => {
    if (!isValidTimeSlot(start, end)) return false;

    const testSlot = { day_of_week: day, start_time: start, end_time: end };
    return disabledSlots.some((disabledSlot) =>
      slotsOverlap(testSlot, disabledSlot)
    );
  };

  // Auto-adjust end time when start time changes
  useEffect(() => {
    if (toMinutes(tempEndTime) <= toMinutes(tempStartTime)) {
      setTempEndTime(fromMinutes(toMinutes(tempStartTime) + 60));
    }
  }, [tempStartTime]);

  // Scroll to selected values when popover opens
  useEffect(() => {
    const scrollToSelected = (
      ref: React.RefObject<HTMLDivElement | null>,
      index: number
    ) => {
      if (ref.current) {
        const selectedElement = ref.current.children[index] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({
            block: "center",
            behavior: "smooth",
          });
        }
      }
    };

    const startTime12 = to12Hour(safeStartTime);
    const endTime12 = to12Hour(safeEndTime);

    // Scroll to selected values
    if (isOpen) {
      scrollToSelected(startHourRef, startTime12.hour - 1);
      scrollToSelected(startMinuteRef, minutes.indexOf(startTime12.minute));
      scrollToSelected(startPeriodRef, periods.indexOf(startTime12.period));
      scrollToSelected(endHourRef, endTime12.hour - 1);
      scrollToSelected(endMinuteRef, minutes.indexOf(endTime12.minute));
      scrollToSelected(endPeriodRef, periods.indexOf(endTime12.period));
    }
  }, [isOpen]);

  const commitChanges = () => {
    if (isValidTimeSlot(tempStartTime, tempEndTime)) {
      // For EMPLOYEE, always use the day from value (locked)
      // For STUDENT, use tempDay (user-selected)
      const finalDay =
        user_type === "EMPLOYEE" && value?.day_of_week !== undefined
          ? value.day_of_week
          : tempDay;

      onChange({
        day_of_week: finalDay,
        start_time: tempStartTime,
        end_time: tempEndTime,
        label: value?.label,
      });
      onClose();
    }
  };

  const resetToValue = () => {
    if (value) {
      // For EMPLOYEE, always use value's day_of_week (locked)
      // For STUDENT, reset to value's day_of_week
      setTempDay(value.day_of_week);
      setTempStartTime(value.start_time);
      setTempEndTime(value.end_time);
    }
  };

  const handleCancel = () => {
    resetToValue();
    onClose();
  };

  // Check if current selection has overlap
  const currentOverlap = hasOverlap(tempDay, tempStartTime, tempEndTime);
  const overlappingSlots = disabledSlots.filter(
    (slot) =>
      slot.day_of_week === tempDay &&
      slotsOverlap(
        {
          day_of_week: tempDay,
          start_time: tempStartTime,
          end_time: tempEndTime,
        },
        slot
      )
  );

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
            <DialogPanel className="w-full max-w-lg rounded-xl bg-secondary py-6 shadow-xl flex flex-col gap-6">
              {/* Header */}
              <div className="flex justify-between items-center px-6">
                <DialogTitle className="text-lg font-semibold text-primary">
                  Select Time Slot
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                </button>
              </div>

              <div className="px-6 flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  {/* Day Selector - Only show for STUDENT schedules */}
                  {user_type === "STUDENT" && (
                    <div className="flex flex-row gap-4 items-center">
                      <h4 className="text-base font-medium text-primary text-center">
                        Day
                      </h4>
                      <div className="flex-1 grid grid-cols-7 border border-primary/50 bg-secondary rounded">
                        {days.map((dayName, dayIndex) => (
                          <div
                            key={dayIndex}
                            onClick={() => setTempDay(dayIndex)}
                            className={cn(
                              "px-2 py-1 cursor-pointer text-center text-sm text-primary rounded",
                              tempDay === dayIndex
                                ? "bg-primary text-background"
                                : "hover:bg-primary/20"
                            )}
                          >
                            {dayName}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Selector */}
                  <div className="w-full flex flex-row justify-around">
                    {/* Start Time */}
                    <div>
                      <h4 className="text-base font-medium text-primary mb-3 text-center">
                        Start Time
                      </h4>
                      <div className="flex gap-2">
                        {/* Hour */}
                        <div
                          ref={startHourRef}
                          className="max-h-32 overflow-y-auto border border-primary/50 bg-secondary rounded"
                        >
                          {hours12.map((hour12) => {
                            const time24 = to24Hour(
                              hour12,
                              to12Hour(safeStartTime).period,
                              to12Hour(safeStartTime).minute
                            );
                            return (
                              <div
                                key={hour12}
                                onClick={() => setTempStartTime(time24)}
                                className={cn(
                                  "px-4 py-1 cursor-pointer text-center text-sm text-primary hover:bg-primary/20",
                                  to12Hour(safeStartTime).hour === hour12 &&
                                    "bg-primary text-background"
                                )}
                              >
                                {hour12}
                              </div>
                            );
                          })}
                        </div>

                        {/* Minute */}
                        <div
                          ref={startMinuteRef}
                          className="max-h-32 overflow-y-auto border border-primary/50 bg-secondary rounded"
                        >
                          {minutes.map((minute) => {
                            const time24 = to24Hour(
                              to12Hour(safeStartTime).hour,
                              to12Hour(safeStartTime).period,
                              minute
                            );
                            return (
                              <div
                                key={minute}
                                onClick={() => setTempStartTime(time24)}
                                className={cn(
                                  "px-3 py-1 cursor-pointer text-center text-sm text-primary hover:bg-primary/20",
                                  to12Hour(safeStartTime).minute === minute &&
                                    "bg-primary text-background"
                                )}
                              >
                                {minute.toString().padStart(2, "0")}
                              </div>
                            );
                          })}
                        </div>

                        {/* AM/PM */}
                        <div
                          ref={startPeriodRef}
                          className="max-h-32 overflow-y-auto border border-primary/50 bg-secondary rounded"
                        >
                          {periods.map((period) => {
                            const time24 = to24Hour(
                              to12Hour(safeStartTime).hour,
                              period,
                              to12Hour(safeStartTime).minute
                            );
                            return (
                              <div
                                key={period}
                                onClick={() => setTempStartTime(time24)}
                                className={cn(
                                  "px-3 py-1 cursor-pointer text-center text-sm text-primary hover:bg-primary/20",
                                  to12Hour(safeStartTime).period === period &&
                                    "bg-primary text-background"
                                )}
                              >
                                {period}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* End Time */}
                    <div>
                      <h4 className="text-base font-medium text-primary mb-3 text-center">
                        End Time
                      </h4>
                      <div className="flex gap-2">
                        {/* Hour */}
                        <div
                          ref={endHourRef}
                          className="max-h-32 overflow-y-auto border border-primary/50 bg-secondary rounded"
                        >
                          {hours12.map((hour12) => {
                            const time24 = to24Hour(
                              hour12,
                              to12Hour(safeEndTime).period,
                              to12Hour(safeEndTime).minute
                            );
                            return (
                              <div
                                key={hour12}
                                onClick={() => setTempEndTime(time24)}
                                className={cn(
                                  "px-4 py-1 cursor-pointer text-center text-sm text-primary hover:bg-primary/20",
                                  to12Hour(safeEndTime).hour === hour12 &&
                                    "bg-primary text-background"
                                )}
                              >
                                {hour12}
                              </div>
                            );
                          })}
                        </div>

                        {/* Minute */}
                        <div
                          ref={endMinuteRef}
                          className="max-h-32 overflow-y-auto border border-primary/50 bg-secondary rounded"
                        >
                          {minutes.map((minute) => {
                            const time24 = to24Hour(
                              to12Hour(safeEndTime).hour,
                              to12Hour(safeEndTime).period,
                              minute
                            );
                            return (
                              <div
                                key={minute}
                                onClick={() => setTempEndTime(time24)}
                                className={cn(
                                  "px-3 py-1 cursor-pointer text-center text-sm text-primary hover:bg-primary/20",
                                  to12Hour(safeEndTime).minute === minute &&
                                    "bg-primary text-background"
                                )}
                              >
                                {minute.toString().padStart(2, "0")}
                              </div>
                            );
                          })}
                        </div>

                        {/* AM/PM */}
                        <div
                          ref={endPeriodRef}
                          className="max-h-32 overflow-y-auto border border-primary/50 bg-secondary rounded"
                        >
                          {periods.map((period) => {
                            const time24 = to24Hour(
                              to12Hour(safeEndTime).hour,
                              period,
                              to12Hour(safeEndTime).minute
                            );
                            return (
                              <div
                                key={period}
                                onClick={() => setTempEndTime(time24)}
                                className={cn(
                                  "px-3 py-1 cursor-pointer text-center text-sm text-primary hover:bg-primary/20",
                                  to12Hour(safeEndTime).period === period &&
                                    "bg-primary text-background"
                                )}
                              >
                                {period}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overlap Warning */}
                  {currentOverlap && (
                    <div className="bg-uRed/10 border border-uRed rounded-md p-3">
                      <div className="flex items-center gap-2 text-primary text-base">
                        <AlertTriangleIcon className="w-4 h-4" />
                        <span className="font-medium">
                          This block overlaps with existing blocks:
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-textBody">
                        {overlappingSlots.map((slot, index) => (
                          <div key={index}>
                            • {days[slot.day_of_week]}{" "}
                            {formatTime(slot.start_time)} -{" "}
                            {formatTime(slot.end_time)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between gap-2">
                  <Button
                    onClick={resetToValue}
                    secondary
                    className="text-sm px-2 py-1"
                  >
                    Reset
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={commitChanges}
                      disabled={currentOverlap}
                      className={cn("text-sm px-2 py-1")}
                    >
                      Done
                    </Button>
                    <Button
                      onClick={handleCancel}
                      secondary
                      className="text-sm px-2 py-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SlotTimePicker;
