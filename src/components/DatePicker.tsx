"use client";

import { cn } from "@/utils/style";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { useMemo, useState } from "react";
import { parseISO } from "date-fns";
import type { Matcher } from "react-day-picker";

interface IDatePicker {
  title?: string;
  value: string;
  setValue: (param: string) => void;
  containerClassName?: string;
  inputClassName?: string;
  placeHolder?: string;
  isRequired?: boolean;
  isValueInvalid?: boolean;
  disabled?: boolean;
  disabledDates?: Matcher | Matcher[];
}

const DatePicker = ({
  title,
  value,
  setValue,
  containerClassName,
  inputClassName,
  placeHolder = "Select Date",
  isRequired = false,
  isValueInvalid = false,
  disabled = false,
  disabledDates,
}: IDatePicker) => {
  const today = useMemo(() => new Date(), []);
  const selectedDate = value ? parseISO(value) : undefined;
  const [tempDate, setTempDate] = useState<Date | undefined>(selectedDate);
  const [open, setOpen] = useState(false);

  function formatDisplay(val: string) {
    if (!val) return placeHolder;
    const d = new Date(val);
    return d.toLocaleDateString("en-PH", { dateStyle: "medium" });
  }

  return (
    <div className={cn("relative flex flex-col", containerClassName)}>
      {title && (
        <div className="text-base text-textBody flex flex-row gap-2">
          <p>{title}</p>
          {isRequired && <p className="text-error">*</p>}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full px-3 py-2 rounded-lg border border-primary text-primary flex items-center gap-2",
              "hover:brightness-110 transition",
              inputClassName,
              isValueInvalid &&
                "border-error/50 focus:border-error hover:border-error/90"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="w-4 h-4" />
            {formatDisplay(value)}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-background border border-primary/20"
          align="start"
        >
          <Calendar
            mode="single"
            selected={tempDate}
            captionLayout="dropdown"
            onSelect={(date) => {
              if (!date) return;
              setTempDate(date);
              setValue(new Date(date).toISOString()); // 👈 saves with timezone
              setOpen(false);
            }}
            disabled={disabledDates || [{ after: today }]}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
