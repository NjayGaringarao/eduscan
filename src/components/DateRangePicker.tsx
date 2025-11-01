"use client";

import React, { useCallback, useMemo, useState } from "react";
import { cn } from "@/utils/style";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

// ---------- Date utilities ----------
const parseIsoDate = (value: string | undefined): Date | undefined => {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

const formatToLocalISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  setFromDate: (date: string) => void;
  setToDate: (date: string) => void;
  containerClassName?: string;
  inputClassName?: string;
  maxDays?: number;
  allowAllDates?: boolean;
}

const DateRangePicker = ({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  containerClassName,
  inputClassName,
  maxDays = 99999,
  allowAllDates = true,
}: DateRangePickerProps) => {
  const safeDate = useCallback((value: string) => parseIsoDate(value), []);
  const toLocalISO = useCallback((date: Date) => formatToLocalISO(date), []);

  const [open, setOpen] = useState(false);
  const [selectingMode, setSelectingMode] = useState<"start" | "end">("start");
  const [tempFrom, setTempFrom] = useState<string | undefined>();
  const [tempTo, setTempTo] = useState<string | undefined>();

  const today = useMemo(() => new Date(), []);
  const startDateObj = useMemo(
    () => (tempFrom ? safeDate(tempFrom) : undefined),
    [tempFrom, safeDate]
  );
  // Compute the max allowed end date based on start and maxDays
  const maxEndDateObj = useMemo(() => {
    if (!startDateObj) return undefined;
    const msInDay = 24 * 60 * 60 * 1000;
    return new Date(startDateObj.getTime() + (maxDays - 1) * msInDay);
  }, [startDateObj, maxDays]);

  function formatDisplay(start: string, end: string) {
    if (!start && !end) return "All Dates";
    if (start && !end)
      return new Date(start)
        .toLocaleDateString("en-PH", { dateStyle: "medium" })
        .concat(" - Select End Date");
    if (start && end)
      return `${new Date(start).toLocaleDateString("en-PH", {
        dateStyle: "medium",
      })} - ${new Date(end).toLocaleDateString("en-PH", {
        dateStyle: "medium",
      })}`;
    return "Select date range";
  }

  const handleSelectAllDates = () => {
    // Only allow "All Dates" if allowAllDates is true AND there's no maxDays restriction
    if (allowAllDates && maxDays >= 99999) {
      setFromDate("");
      setToDate("");
      setSelectingMode("start");
      setTempFrom(undefined);
      setTempTo(undefined);
      setOpen(false);
    }
  };

  const isAllDatesSelected = !fromDate && !toDate;
  const canSelectAllDates = allowAllDates && maxDays >= 99999;

  const handleStartSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = toLocalISO(date);
    setTempFrom(dateStr);
    if (tempTo && dateStr > tempTo) setTempTo(undefined);
    setSelectingMode("end");
  };

  const handleEndSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = toLocalISO(date);

    // Commit and close
    const finalFrom = (tempFrom ?? fromDate) || dateStr;
    const finalTo = dateStr;
    const startIso = finalFrom <= finalTo ? finalFrom : finalTo;
    const endIso = finalFrom <= finalTo ? finalTo : finalFrom;

    // Enforce maxDays (only if maxDays is less than 99999, meaning there's a limit)
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    const msInDay = 24 * 60 * 60 * 1000;
    const rangeDays =
      Math.floor((endDate.getTime() - startDate.getTime()) / msInDay) + 1;

    if (maxDays < 99999 && rangeDays > maxDays) {
      // clamp end date to maxDays-1 after start
      const clampedEnd = new Date(
        startDate.getTime() + (maxDays - 1) * msInDay
      );
      setFromDate(startIso);
      setToDate(toLocalISO(clampedEnd));
    } else {
      setFromDate(startIso);
      setToDate(endIso);
    }
    setSelectingMode("start");
    setTempFrom(undefined);
    setTempTo(undefined);
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset when closing
      setSelectingMode("start");
      setTempFrom(undefined);
      setTempTo(undefined);
    }
  };

  return (
    <div className={cn("relative flex flex-col", containerClassName)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full px-3 py-2 rounded-lg border border-primary text-primary flex items-center gap-2",
              "hover:brightness-110 transition",
              inputClassName
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            {formatDisplay(fromDate, toDate)}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-background border border-primary/20"
          align="start"
        >
          <div className="p-3">
            {canSelectAllDates && (
              <div className="mb-3">
                <button
                  onClick={handleSelectAllDates}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border text-sm transition",
                    isAllDatesSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-textBody border-primary/20 hover:brightness-110"
                  )}
                >
                  {isAllDatesSelected
                    ? "✓ All Dates Selected"
                    : "Select All Dates"}
                </button>
              </div>
            )}
            <div className="flex flex-row gap-4">
              {/* Start Calendar */}
              <div
                className={cn(
                  "relative flex flex-col rounded-md overflow-hidden",
                  selectingMode === "start" &&
                    "border-primary/20 border shadow-md"
                )}
              >
                <Calendar
                  mode="single"
                  selected={tempFrom ? safeDate(tempFrom) : undefined}
                  captionLayout="dropdown"
                  disabled={[{ after: today }]}
                  onSelect={handleStartSelect}
                />

                {selectingMode !== "start" && (
                  <div className="absolute h-full w-full bg-background/70" />
                )}
              </div>

              {/* End Calendar */}
              <div
                className={cn(
                  "relative flex flex-col rounded-md overflow-hidden",
                  selectingMode === "end" &&
                    "border-primary/20 border shadow-md"
                )}
              >
                <Calendar
                  mode="single"
                  selected={tempTo ? safeDate(tempTo) : undefined}
                  captionLayout="dropdown"
                  disabled={[
                    ...(startDateObj ? [{ before: startDateObj }] : []),
                    { after: today },
                    ...(maxEndDateObj ? [{ after: maxEndDateObj }] : []),
                  ]}
                  onSelect={handleEndSelect}
                />
                {selectingMode !== "end" && (
                  <div className="absolute h-full w-full bg-background/70" />
                )}
              </div>
            </div>
            <div
              className={cn("flex flex-row gap-4 text-textBody text-sm pt-2")}
            >
              <p>SELECTED RANGE:</p>
              {isAllDatesSelected ? (
                <p className="text-primary font-medium">All Dates</p>
              ) : (
                <>
                  <div className="flex flex-row gap-1">
                    <p className="w-10">Start:</p>
                    <p>
                      {tempFrom
                        ? new Date(tempFrom).toLocaleDateString("en-PH", {
                            dateStyle: "medium",
                          })
                        : fromDate
                        ? new Date(fromDate).toLocaleDateString("en-PH", {
                            dateStyle: "medium",
                          })
                        : "[ Select start date ]"}
                    </p>
                  </div>
                  <div className="flex flex-row gap-1">
                    <p className="w-10">End:</p>
                    <p>
                      {tempFrom
                        ? tempTo
                          ? new Date(tempTo).toLocaleDateString("en-PH", {
                              dateStyle: "medium",
                            })
                          : "[ Select end date ]"
                        : toDate
                        ? new Date(toDate).toLocaleDateString("en-PH", {
                            dateStyle: "medium",
                          })
                        : "---"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;
