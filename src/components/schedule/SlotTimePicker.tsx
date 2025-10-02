"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { cn } from "@/utils/style";
import Button from "../Button";
import { ClockIcon, AlertTriangleIcon } from "lucide-react";

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
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const formatTime = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  let h12 = hour % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${minute.toString().padStart(2, "0")} ${period}`;
};

const formatSlot = (slot: {
  day_of_week: number;
  start_time: string;
  end_time: string;
  label?: string;
}) => {
  const dayName = days[slot.day_of_week] || "Sun";
  return `${dayName} ${formatTime(slot.start_time)} - ${formatTime(
    slot.end_time
  )}`;
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
  disabled,
  disabledSlots = [],
  className,
  containerClassName,
  stepMinutes = 15,
}) => {
  const [tempDay, setTempDay] = useState<number>(value?.day_of_week ?? 0);
  const [tempStartTime, setTempStartTime] = useState<string>(
    value?.start_time ?? "08:00"
  );
  const [tempEndTime, setTempEndTime] = useState<string>(
    value?.end_time ?? "09:00"
  );

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
    scrollToSelected(startHourRef, startTime12.hour - 1);
    scrollToSelected(startMinuteRef, minutes.indexOf(startTime12.minute));
    scrollToSelected(startPeriodRef, periods.indexOf(startTime12.period));
    scrollToSelected(endHourRef, endTime12.hour - 1);
    scrollToSelected(endMinuteRef, minutes.indexOf(endTime12.minute));
    scrollToSelected(endPeriodRef, periods.indexOf(endTime12.period));
  }, []);

  const commitChanges = () => {
    if (isValidTimeSlot(tempStartTime, tempEndTime)) {
      onChange({
        day_of_week: tempDay,
        start_time: tempStartTime,
        end_time: tempEndTime,
        label: value?.label,
      });
    }
  };

  const resetToValue = () => {
    if (value) {
      setTempDay(value.day_of_week);
      setTempStartTime(value.start_time);
      setTempEndTime(value.end_time);
    }
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
    <Popover className={cn("relative z-50", containerClassName)}>
      {({ close }) => (
        <>
          <PopoverButton
            disabled={disabled}
            className={cn(
              "bg-background border border-primary/40 rounded-md px-3 py-2 text-primary",
              "flex items-center gap-2 w-full",
              "focus:outline-none focus:ring-2 focus:ring-primary/40",

              className
            )}
          >
            <ClockIcon className="w-5 h-5 text-primary/70" />
            {value ? formatSlot(value) : "Select time slot"}
          </PopoverButton>

          <PopoverPanel
            className={cn(
              "absolute z-50 mt-2 rounded-md p-4",
              "bg-secondary shadow-lg border border-primary/20",
              "flex flex-col gap-4 min-w-96"
            )}
          >
            <div className="flex flex-col gap-4">
              {/* Day Selector */}
              <div className="flex flex-row gap-4 items-center">
                <h4 className="text-sm font-medium text-primary text-center">
                  Day
                </h4>
                <div className="grid grid-cols-7 gap-1 border border-primary/50 bg-secondary rounded">
                  {days.map((dayName, dayIndex) => (
                    <div
                      key={dayIndex}
                      onClick={() => setTempDay(dayIndex)}
                      className={cn(
                        "px-2 py-1 cursor-pointer text-center text-xs text-primary rounded",
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

              {/* Time Selector */}
              <div className="w-full flex flex-row justify-between">
                {/* Start Time */}
                <div>
                  <h4 className="text-sm font-medium text-primary mb-3 text-center">
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
                              "px-4 py-1 cursor-pointer text-center text-xs text-primary hover:bg-primary/20",
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
                              "px-3 py-1 cursor-pointer text-center text-xs text-primary hover:bg-primary/20",
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
                              "px-3 py-1 cursor-pointer text-center text-xs text-primary hover:bg-primary/20",
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
                  <h4 className="text-sm font-medium text-primary mb-3 text-center">
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
                              "px-4 py-1 cursor-pointer text-center text-xs text-primary hover:bg-primary/20",
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
                              "px-3 py-1 cursor-pointer text-center text-xs text-primary hover:bg-primary/20",
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
                              "px-3 py-1 cursor-pointer text-center text-xs text-primary hover:bg-primary/20",
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
                  <div className="flex items-center gap-2 text-primary text-sm">
                    <AlertTriangleIcon className="w-4 h-4" />
                    <span className="font-medium">
                      This block overlaps with existing blocks:
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-textBody">
                    {overlappingSlots.map((slot, index) => (
                      <div key={index}>
                        • {days[slot.day_of_week]} {formatTime(slot.start_time)}{" "}
                        - {formatTime(slot.end_time)}
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
                className="text-xs px-2 py-1"
              >
                Reset
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    commitChanges();
                    close();
                  }}
                  disabled={currentOverlap}
                  className={cn("text-xs px-2 py-1")}
                >
                  Done
                </Button>
                <Button
                  onClick={() => {
                    resetToValue();
                    close();
                  }}
                  secondary
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};

export default SlotTimePicker;
