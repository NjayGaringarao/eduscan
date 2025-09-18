"use client";

import React from "react";
import { cn } from "@/utils/style";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Calendar } from "./ui/calendar";

// ---------- Date utilities (timezone-safe) ----------
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
}

const DateRangePicker = ({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  containerClassName,
}: DateRangePickerProps) => {
  // Timezone-safe helpers: parse and format dates in local time
  const safeDate = React.useCallback(
    (value: string) => parseIsoDate(value),
    []
  );
  const toLocalISO = React.useCallback(
    (date: Date) => formatToLocalISO(date),
    []
  );

  // Draft selection state (reset on cancel, commit on end selection)
  const [selectingMode, setSelectingMode] = React.useState<"start" | "end">(
    "start"
  );
  const [tempFrom, setTempFrom] = React.useState<string | undefined>();
  const [tempTo, setTempTo] = React.useState<string | undefined>();

  // format user-facing label
  const formatDisplay = (start: string, end: string) => {
    if (!start && !end) return "Select Starting Date";
    if (start && !end)
      return new Date(start)
        .toLocaleDateString("en-PH", {
          dateStyle: "medium",
        })
        .concat(" - Select End Date");
    if (start && end)
      return `${new Date(start).toLocaleDateString("en-PH", {
        dateStyle: "medium",
      })} - ${new Date(end).toLocaleDateString("en-PH", {
        dateStyle: "medium",
      })}`;
    return "Select date range";
  };

  return (
    <Popover className="relative">
      {({ open, close }) => {
        // Initialize draft on open; discard on close (outside click)
        React.useEffect(() => {
          if (open) {
            // Start fresh: show no current value until user selects
            setSelectingMode("start");
            setTempFrom(undefined);
            setTempTo(undefined);
          } else {
            setSelectingMode("start");
            setTempFrom(undefined);
            setTempTo(undefined);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [open]);

        const today = React.useMemo(() => new Date(), []);
        const startDateObj = React.useMemo(
          () => (tempFrom ? safeDate(tempFrom) : undefined),
          [tempFrom, safeDate]
        );
        const heading = React.useMemo(
          () => formatDisplay(tempFrom ?? "", tempTo ?? ""),
          [tempFrom, tempTo]
        );

        return (
          <>
            <PopoverButton
              className={cn(
                "px-3 py-2 rounded-lg border border-primary text-primary flex items-center gap-2",
                "hover:bg-primary/10 transition",
                containerClassName
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              {formatDisplay(fromDate, toDate)}
            </PopoverButton>

            <PopoverPanel className="absolute z-50 mt-2 rounded-md border bg-background shadow-lg">
              <div className="p-3">
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
                          { after: today },
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
                      if (finalFrom <= finalTo) {
                        setFromDate(finalFrom);
                        setToDate(finalTo);
                      } else {
                        setFromDate(finalTo);
                        setToDate(finalFrom);
                      }
                      setSelectingMode("start");
                      setTempFrom(undefined);
                      setTempTo(undefined);
                      close();
                    }
                  }}
                  className="rounded-md text-textBody"
                />
                <div className="flex flex-col gap-0 text-primary/70 text-sm border-t border-primary/40 p-3">
                  <p>DATE RANGE</p>
                  <div className="flex flex-row gap-1 ml-4">
                    <p className="w-10">Start:</p>

                    <p className="text-textBody">
                      {tempFrom
                        ? new Date(tempFrom).toLocaleDateString("en-PH", {
                            dateStyle: "medium",
                          })
                        : "[ Select start date] "}
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
              </div>
            </PopoverPanel>
          </>
        );
      }}
    </Popover>
  );
};

export default DateRangePicker;
