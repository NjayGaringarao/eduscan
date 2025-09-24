"use client";

import React, { useState, useMemo } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { cn } from "@/utils/style";
import Button from "./Button";
import { ClockIcon } from "lucide-react";

export type TimeValue = `${number}${number}:${number}${number}` | string; // HH:MM
type Period = "AM" | "PM";

interface TimePickerProps {
  value: TimeValue | null;
  onChange: (time: TimeValue) => void;
  stepMinutes?: number; // default 5
  disabled?: boolean;
  start?: TimeValue; // earliest selectable (inclusive)
  end?: TimeValue; // latest selectable (exclusive)
  disabledRanges?: Array<{ start: TimeValue; end: TimeValue }>; // disable [start, end)
  className?: string;
  containerClassName?: string;
}

const toMinutes = (t: TimeValue) => {
  const [h, m] = String(t)
    .split(":")
    .map((n) => parseInt(n, 10));
  return h * 60 + m;
};

const build24 = (h12: number, m: number, p: Period) => {
  let h24 = h12 % 12;
  if (p === "PM") h24 += 12;
  return `${h24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const parseValue = (val: TimeValue | null) => {
  if (!val) return { h: 12, m: 0, p: "AM" as Period };
  const [h, m] = val.split(":").map(Number);
  const p: Period = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return { h: h12, m, p };
};

const formatAMPM = (val: TimeValue | null) => {
  if (!val) return "--:--";
  const [h, m] = val.split(":").map(Number);
  const period: Period = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
};

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  stepMinutes = 5,
  disabled,
  disabledRanges = [],
  className,
  containerClassName,
}) => {
  const { h: initH, m: initM, p: initP } = parseValue(value);

  const [hour, setHour] = useState(initH);
  const [minute, setMinute] = useState(initM);
  const [period, setPeriod] = useState<Period>(initP);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = useMemo(
    () => Array.from({ length: 60 / stepMinutes }, (_, i) => i * stepMinutes),
    [stepMinutes]
  );
  const periods: Period[] = ["AM", "PM"];

  const disabledCheck = (hh: number, mm: number, pp: Period) => {
    const hhmm = build24(hh, mm, pp);
    const v = toMinutes(hhmm);
    return disabledRanges.some((r) => {
      const startMins = toMinutes(r.start);
      const endMins = toMinutes(r.end);
      // Handle day rollover case
      if (startMins > endMins) {
        // Range crosses midnight (e.g., 22:00 to 06:00)
        return v >= startMins || v < endMins;
      }
      return v >= startMins && v < endMins;
    });
  };

  const commit = (close: () => void) => {
    const hhmm = build24(hour, minute, period);
    if (!disabledCheck(hour, minute, period)) {
      onChange(hhmm);
    }
    close();
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
              "flex items-center gap-2",
              "focus:outline-none focus:ring-2 focus:ring-primary/40",
              className
            )}
          >
            <ClockIcon className="w-5 h-5 text-primary/70" />
            {formatAMPM(value)}
          </PopoverButton>

          <PopoverPanel className="absolute z-50 mt-2 rounded-md bg-white shadow-lg border border-primary/20 p-4 w-auto min-w-[200px]">
            <div className="flex flex-row mb-4">
              {/* Hour */}
              <div className="max-h-40 overflow-y-auto border rounded">
                {hours.map((h) => {
                  const disabled = disabledCheck(h, minute, period);
                  return (
                    <div
                      key={h}
                      onClick={() => !disabled && setHour(h)}
                      className={cn(
                        "px-6 py-1 cursor-pointer text-center",
                        h === hour && "bg-primary text-white",
                        disabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {h}
                    </div>
                  );
                })}
              </div>

              {/* Minute */}
              <div className="max-h-40 overflow-y-auto border rounded">
                {minutes.map((m) => {
                  const disabled = disabledCheck(hour, m, period);
                  return (
                    <div
                      key={m}
                      onClick={() => !disabled && setMinute(m)}
                      className={cn(
                        "px-6 py-1 cursor-pointer text-center",
                        m === minute && "bg-primary text-white",
                        disabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {m.toString().padStart(2, "0")}
                    </div>
                  );
                })}
              </div>

              {/* Period */}
              <div className="max-h-40 overflow-y-auto border rounded">
                {periods.map((p) => {
                  const disabled = disabledCheck(hour, minute, p);
                  return (
                    <div
                      key={p}
                      onClick={() => !disabled && setPeriod(p)}
                      className={cn(
                        "px-6 py-1 cursor-pointer text-center",
                        p === period && "bg-primary text-white",
                        disabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {p}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button onClick={() => commit(close)}>OK</Button>
              <Button onClick={() => close()} secondary>
                Cancel
              </Button>
            </div>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};

export default TimePicker;
