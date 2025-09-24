"use client";

import React, { useState, useMemo } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { cn } from "@/utils/style";
import Button from "../Button";
import { ClockIcon } from "lucide-react";

import { DateTime, SlotSpan } from "@/models";

// Re-export types for convenience
export type { DateTime, SlotSpan };

interface SlotSpanPickerProps {
  value: SlotSpan | null;
  onChange: (span: SlotSpan) => void;
  disabled?: boolean;
  disabledSpans?: SlotSpan[]; // Array of occupied spans to disable
  className?: string;
  containerClassName?: string;
  stepMinutes?: number; // default 15
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const formatDateTime = (dt: DateTime) => {
  const dayName = days[dt.day] || "Sun";
  const period = dt.hour >= 12 ? "PM" : "AM";
  let h12 = dt.hour % 12;
  if (h12 === 0) h12 = 12;
  return `${dayName} ${h12}:${dt.minute.toString().padStart(2, "0")} ${period}`;
};

// Helper functions for 12-hour format
const to12Hour = (hour24: number) => {
  if (hour24 === 0) return { hour: 12, period: "AM" as const };
  if (hour24 < 12) return { hour: hour24, period: "AM" as const };
  if (hour24 === 12) return { hour: 12, period: "PM" as const };
  return { hour: hour24 - 12, period: "PM" as const };
};

const to24Hour = (hour12: number, period: "AM" | "PM") => {
  if (period === "AM") {
    return hour12 === 12 ? 0 : hour12;
  } else {
    return hour12 === 12 ? 12 : hour12 + 12;
  }
};

const formatSpan = (span: SlotSpan) => {
  return `${formatDateTime(span.start)} - ${formatDateTime(span.end)}`;
};

const toMinutes = (dt: DateTime) => {
  return dt.day * 24 * 60 + dt.hour * 60 + dt.minute;
};

// const fromMinutes = (totalMinutes: number): DateTime => {
//   const day = Math.floor(totalMinutes / (24 * 60));
//   const remaining = totalMinutes % (24 * 60);
//   const hour = Math.floor(remaining / 60);
//   const minute = remaining % 60;
//   return {
//     day: day % 7,
//     hour,
//     minute,
//   };
// }; // Unused function removed

const isValidSpan = (start: DateTime, end: DateTime): boolean => {
  return toMinutes(end) > toMinutes(start);
};

const spansOverlap = (span1: SlotSpan, span2: SlotSpan): boolean => {
  const start1 = toMinutes(span1.start);
  const end1 = toMinutes(span1.end);
  const start2 = toMinutes(span2.start);
  const end2 = toMinutes(span2.end);

  const overlaps = !(end1 <= start2 || end2 <= start1);

  // Debug logging (remove in production)
  if (overlaps) {
    console.log("Overlap detected:", {
      span1: formatSpan(span1),
      span2: formatSpan(span2),
      start1,
      end1,
      start2,
      end2,
    });
  }

  return overlaps;
};

const SlotSpanPicker: React.FC<SlotSpanPickerProps> = ({
  value,
  onChange,
  disabled,
  disabledSpans = [],
  className,
  containerClassName,
  stepMinutes = 15,
}) => {
  const [tempStart, setTempStart] = useState<DateTime>(
    value?.start || { day: 0, hour: 8, minute: 0 }
  );
  const [tempEnd, setTempEnd] = useState<DateTime>(
    value?.end || { day: 0, hour: 9, minute: 0 }
  );

  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = useMemo(
    () => Array.from({ length: 60 / stepMinutes }, (_, i) => i * stepMinutes),
    [stepMinutes]
  );
  const periods = ["AM", "PM"] as const;

  const isDisabledDateTime = (dt: DateTime): boolean => {
    if (!value) return false;

    // Create a temporary span to check overlaps
    const tempSpan: SlotSpan = {
      start: dt,
      end: dt, // We'll check both start and end combinations
    };

    // Check overlaps with disabled spans
    return disabledSpans.some((disabledSpan) =>
      spansOverlap(tempSpan, disabledSpan)
    );
  };

  const isDisabledStartTime = (dt: DateTime): boolean => {
    // Check if start time creates a valid span
    if (!isValidSpan(dt, tempEnd)) return true;

    // Check for overlaps with disabled spans
    const testSpan: SlotSpan = { start: dt, end: tempEnd, label: value?.label };
    return disabledSpans.some((disabledSpan) =>
      spansOverlap(testSpan, disabledSpan)
    );
  };

  const isDisabledEndTime = (dt: DateTime): boolean => {
    // Check if end time creates a valid span
    if (!isValidSpan(tempStart, dt)) return true;

    // Check for overlaps with disabled spans
    const testSpan: SlotSpan = {
      start: tempStart,
      end: dt,
      label: value?.label,
    };
    return disabledSpans.some((disabledSpan) =>
      spansOverlap(testSpan, disabledSpan)
    );
  };

  const updateStartDateTime = (
    day: number,
    hour12: number,
    minute: number,
    period: "AM" | "PM"
  ) => {
    const hour24 = to24Hour(hour12, period);
    setTempStart({ day, hour: hour24, minute });
  };

  const updateEndDateTime = (
    day: number,
    hour12: number,
    minute: number,
    period: "AM" | "PM"
  ) => {
    const hour24 = to24Hour(hour12, period);
    setTempEnd({ day, hour: hour24, minute });
  };

  const commitChanges = () => {
    if (isValidSpan(tempStart, tempEnd)) {
      onChange({
        start: tempStart,
        end: tempEnd,
        label: value?.label,
      });
    }
  };

  const resetToValue = () => {
    if (value) {
      setTempStart(value.start);
      setTempEnd(value.end);
    }
  };

  return (
    <Popover className={cn("relative", containerClassName)}>
      {({ close }) => (
        <>
          {/* Trigger button */}
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
            {value ? formatSpan(value) : "Select time span"}
          </PopoverButton>

          <PopoverPanel
            className={cn(
              "absolute z-50 mt-2 rounded-md p-4",
              "bg-secondary shadow-lg border border-primary/20",
              "flex flex-col gap-4"
            )}
          >
            <div className="flex flex-col gap-4 md:flex-row md:gap-6">
              {/* Start Time Column */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-primary mb-3 text-center">
                  Start Time
                </h4>
                <div className="flex flex-row gap-2">
                  {/* Day Selector */}
                  <div
                    className="max-h-40 overflow-y-auto border border-primary/50 bg-secondary rounded"
                    style={{
                      scrollbarWidth: "thin",
                    }}
                  >
                    {days.map((dayName, dayIndex) => {
                      const dt = { ...tempStart, day: dayIndex };
                      const disabled = isDisabledStartTime(dt);
                      return (
                        <div
                          key={dayIndex}
                          onClick={() => {
                            if (!disabled) {
                              updateStartDateTime(
                                dayIndex,
                                to12Hour(tempStart.hour).hour,
                                tempStart.minute,
                                to12Hour(tempStart.hour).period
                              );
                            }
                          }}
                          className={cn(
                            "px-3 py-1 cursor-pointer text-center text-xs text-primary",
                            tempStart.day === dayIndex &&
                              "bg-primary text-background",
                            disabled && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {dayName}
                        </div>
                      );
                    })}
                  </div>

                  {/* Hour Selector (12-hour) */}
                  <div
                    className="max-h-40 overflow-y-auto border border-primary/50 bg-secondary rounded"
                    style={{
                      scrollbarWidth: "thin",
                    }}
                  >
                    {hours12.map((hour12) => {
                      const dt = {
                        ...tempStart,
                        hour: to24Hour(hour12, to12Hour(tempStart.hour).period),
                      };
                      const disabled = isDisabledStartTime(dt);
                      return (
                        <div
                          key={hour12}
                          onClick={() => {
                            if (!disabled) {
                              updateStartDateTime(
                                tempStart.day,
                                hour12,
                                tempStart.minute,
                                to12Hour(tempStart.hour).period
                              );
                            }
                          }}
                          className={cn(
                            "px-3 py-1 cursor-pointer text-center text-xs text-primary",
                            to12Hour(tempStart.hour).hour === hour12 &&
                              "bg-primary text-background",
                            disabled && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {hour12}
                        </div>
                      );
                    })}
                  </div>

                  {/* Minute Selector */}
                  <div
                    className="max-h-40 overflow-y-auto border border-primary/50 bg-secondary rounded"
                    style={{
                      scrollbarWidth: "thin",
                    }}
                  >
                    {minutes.map((minute) => {
                      const dt = { ...tempStart, minute };
                      const disabled = isDisabledStartTime(dt);
                      return (
                        <div
                          key={minute}
                          onClick={() => {
                            if (!disabled) {
                              updateStartDateTime(
                                tempStart.day,
                                to12Hour(tempStart.hour).hour,
                                minute,
                                to12Hour(tempStart.hour).period
                              );
                            }
                          }}
                          className={cn(
                            "px-3 py-1 cursor-pointer text-center text-xs text-primary",
                            tempStart.minute === minute &&
                              "bg-primary text-background",
                            disabled && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {minute.toString().padStart(2, "0")}
                        </div>
                      );
                    })}
                  </div>

                  {/* AM/PM Selector */}
                  <div
                    className="max-h-40 overflow-y-auto border border-primary/50 bg-secondary rounded"
                    style={{
                      scrollbarWidth: "thin",
                    }}
                  >
                    {periods.map((period) => {
                      const dt = {
                        ...tempStart,
                        hour: to24Hour(to12Hour(tempStart.hour).hour, period),
                      };
                      const disabled = isDisabledStartTime(dt);
                      return (
                        <div
                          key={period}
                          onClick={() => {
                            if (!disabled) {
                              updateStartDateTime(
                                tempStart.day,
                                to12Hour(tempStart.hour).hour,
                                tempStart.minute,
                                period
                              );
                            }
                          }}
                          className={cn(
                            "px-3 py-1 cursor-pointer text-center text-xs text-primary",
                            to12Hour(tempStart.hour).period === period &&
                              "bg-primary text-background",
                            disabled && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {period}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* End Time Column */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-primary mb-3 text-center">
                  End Time
                </h4>
                <div className="flex flex-row gap-2">
                  {/* Day Selector */}
                  <div
                    className="max-h-40 overflow-y-auto border border-primary/50 bg-secondary rounded"
                    style={{
                      scrollbarWidth: "thin",
                    }}
                  >
                    {days.map((dayName, dayIndex) => {
                      const dt = { ...tempEnd, day: dayIndex };
                      const disabled = isDisabledEndTime(dt);
                      return (
                        <div
                          key={dayIndex}
                          onClick={() => {
                            if (!disabled) {
                              updateEndDateTime(
                                dayIndex,
                                to12Hour(tempEnd.hour).hour,
                                tempEnd.minute,
                                to12Hour(tempEnd.hour).period
                              );
                            }
                          }}
                          className={cn(
                            "px-3 py-1 cursor-pointer text-center text-xs text-primary",
                            tempEnd.day === dayIndex &&
                              "bg-primary text-background",
                            disabled && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {dayName}
                        </div>
                      );
                    })}
                  </div>

                  {/* Hour Selector (12-hour) */}
                  <div
                    className="max-h-40 overflow-y-auto border border-primary/50 bg-secondary rounded"
                    style={{
                      scrollbarWidth: "thin",
                    }}
                  >
                    {hours12.map((hour12) => {
                      const dt = {
                        ...tempEnd,
                        hour: to24Hour(hour12, to12Hour(tempEnd.hour).period),
                      };
                      const disabled = isDisabledEndTime(dt);
                      return (
                        <div
                          key={hour12}
                          onClick={() => {
                            if (!disabled) {
                              updateEndDateTime(
                                tempEnd.day,
                                hour12,
                                tempEnd.minute,
                                to12Hour(tempEnd.hour).period
                              );
                            }
                          }}
                          className={cn(
                            "px-3 py-1 cursor-pointer text-center text-xs text-primary",
                            to12Hour(tempEnd.hour).hour === hour12 &&
                              "bg-primary text-background",
                            disabled && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {hour12}
                        </div>
                      );
                    })}
                  </div>

                  {/* Minute Selector */}
                  <div
                    className="max-h-40 overflow-y-auto border border-primary/50 bg-secondary rounded"
                    style={{
                      scrollbarWidth: "thin",
                    }}
                  >
                    {minutes.map((minute) => {
                      const dt = { ...tempEnd, minute };
                      const disabled = isDisabledEndTime(dt);
                      return (
                        <div
                          key={minute}
                          onClick={() => {
                            if (!disabled) {
                              updateEndDateTime(
                                tempEnd.day,
                                to12Hour(tempEnd.hour).hour,
                                minute,
                                to12Hour(tempEnd.hour).period
                              );
                            }
                          }}
                          className={cn(
                            "px-3 py-1 cursor-pointer text-center text-xs text-primary",
                            tempEnd.minute === minute &&
                              "bg-primary text-background",
                            disabled && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {minute.toString().padStart(2, "0")}
                        </div>
                      );
                    })}
                  </div>

                  {/* AM/PM Selector */}
                  <div
                    className="max-h-40 overflow-y-auto border border-primary/50 bg-secondary rounded"
                    style={{
                      scrollbarWidth: "thin",
                    }}
                  >
                    {periods.map((period) => {
                      const dt = {
                        ...tempEnd,
                        hour: to24Hour(to12Hour(tempEnd.hour).hour, period),
                      };
                      const disabled = isDisabledEndTime(dt);
                      return (
                        <div
                          key={period}
                          onClick={() => {
                            if (!disabled) {
                              updateEndDateTime(
                                tempEnd.day,
                                to12Hour(tempEnd.hour).hour,
                                tempEnd.minute,
                                period
                              );
                            }
                          }}
                          className={cn(
                            "px-3 py-1 cursor-pointer text-center text-xs text-primary",
                            to12Hour(tempEnd.hour).period === period &&
                              "bg-primary text-background",
                            disabled && "opacity-40 cursor-not-allowed"
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

            {/* Actions */}
            <div className="flex justify-between gap-2">
              <Button
                onClick={() => {
                  resetToValue();
                }}
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
                  className="text-xs px-2 py-1"
                >
                  Done
                </Button>
                <Button
                  onClick={() => close()}
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

export default SlotSpanPicker;
