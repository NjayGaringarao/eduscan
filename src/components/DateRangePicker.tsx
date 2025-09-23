"use client";

import React, { useCallback, useMemo, useState } from "react";
import { cn } from "@/utils/style";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
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
}

const DateRangePicker = ({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  containerClassName,
  inputClassName,
  maxDays = 31,
}: DateRangePickerProps) => {
  const safeDate = useCallback((value: string) => parseIsoDate(value), []);
  const toLocalISO = useCallback((date: Date) => formatToLocalISO(date), []);

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
    if (!start && !end) return "Select Starting Date";
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

  return (
    <Popover className={cn("relative", containerClassName)}>
      {({ close }) => {
        return (
          <>
            <PopoverButton
              className={cn(
                "w-full px-3 py-2 rounded-lg border border-primary text-primary flex items-center gap-2",
                "hover:brightness-110 transition",
                inputClassName
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              {formatDisplay(fromDate, toDate)}
            </PopoverButton>

            <PopoverPanel className="absolute z-50 mt-2 rounded-md border bg-background shadow-lg">
              <div className="p-3">
                <div
                  className={cn(
                    "flex flex-col gap-0 text-primary/70 text-sm border-b border-primary/40 p-3"
                  )}
                >
                  <p>DATE RANGE</p>
                  <div className="flex flex-row gap-1 ml-4">
                    <p className="w-10">Start:</p>
                    <p className="text-textBody">
                      {tempFrom
                        ? new Date(tempFrom).toLocaleDateString("en-PH", {
                            dateStyle: "medium",
                          })
                        : "[ Select start date ] "}
                    </p>
                  </div>
                  <div className="flex flex-row gap-1 ml-4">
                    <p className="w-10">End:</p>
                    <p className="text-textBody">
                      {tempFrom
                        ? tempTo
                          ? new Date(tempTo).toLocaleDateString("en-PH", {
                              dateStyle: "medium",
                            })
                          : "[ Select end date ]"
                        : "---"}
                    </p>
                  </div>
                </div>

                <Calendar
                  mode="single"
                  numberOfMonths={1}
                  selected={
                    selectingMode === "start"
                      ? tempFrom
                        ? safeDate(tempFrom)
                        : undefined
                      : tempTo
                      ? safeDate(tempTo)
                      : undefined
                  }
                  disabled={
                    selectingMode === "start"
                      ? [{ after: today }]
                      : [
                          ...(startDateObj ? [{ before: startDateObj }] : []),
                          // Disable after today
                          { after: today },
                          // Disable after max allowed end date
                          ...(maxEndDateObj ? [{ after: maxEndDateObj }] : []),
                        ]
                  }
                  onSelect={(date) => {
                    if (!date) return;
                    const dateStr = toLocalISO(date);

                    if (selectingMode === "start") {
                      setTempFrom(dateStr);
                      if (tempTo && dateStr > tempTo) setTempTo(undefined);
                      setSelectingMode("end");
                    } else {
                      // Commit and close
                      const finalFrom = (tempFrom ?? fromDate) || dateStr;
                      const finalTo = dateStr;
                      const startIso =
                        finalFrom <= finalTo ? finalFrom : finalTo;
                      const endIso = finalFrom <= finalTo ? finalTo : finalFrom;

                      // Enforce maxDays
                      const startDate = new Date(startIso);
                      const endDate = new Date(endIso);
                      const msInDay = 24 * 60 * 60 * 1000;
                      const rangeDays =
                        Math.floor(
                          (endDate.getTime() - startDate.getTime()) / msInDay
                        ) + 1;

                      if (rangeDays > maxDays) {
                        // clamp end date to maxDays-1 after start
                        const clampedEnd = new Date(
                          startDate.getTime() + (maxDays - 1) * msInDay
                        );
                        setFromDate(new Date(startIso).toISOString());
                        setToDate(clampedEnd.toISOString());
                      } else {
                        setFromDate(new Date(startIso).toISOString());
                        setToDate(new Date(endIso).toISOString());
                      }
                      setSelectingMode("start");
                      setTempFrom(undefined);
                      setTempTo(undefined);
                      close(); // ✅ use Headless UI's close()
                    }
                  }}
                  className="rounded-md text-textBody"
                />
              </div>
            </PopoverPanel>
          </>
        );
      }}
    </Popover>
  );
};

export default DateRangePicker;
