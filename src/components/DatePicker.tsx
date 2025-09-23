"use client";

import { cn } from "@/utils/style";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Calendar } from "./ui/calendar";
import { useMemo, useState } from "react";
import { formatISO, parseISO } from "date-fns";

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
}: IDatePicker) => {
  const today = useMemo(() => new Date(), []);
  const selectedDate = value ? parseISO(value) : undefined;
  const [tempDate, setTempDate] = useState<Date | undefined>(selectedDate);

  function formatDisplay(val: string) {
    if (!val) return placeHolder;
    const d = new Date(val);
    return d.toLocaleDateString("en-PH", { dateStyle: "medium" });
  }

  return (
    <div className={cn("relative flex flex-col gap-1", containerClassName)}>
      {title && (
        <div className="text-base text-textBody flex flex-row gap-2">
          <p>{title}</p>
          {isRequired && <p className="text-error">*</p>}
        </div>
      )}

      <Popover className="relative">
        {({ close }) => (
          <>
            <PopoverButton
              disabled={disabled}
              className={cn(
                "px-3 py-2 rounded-lg border border-primary text-primary flex items-center gap-2",
                "hover:bg-primary/10 transition",
                inputClassName,
                isValueInvalid && "border-error/50 hover:border-error",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              {formatDisplay(value)}
            </PopoverButton>

            <PopoverPanel className="absolute z-50 mt-2 rounded-md border bg-background shadow-lg">
              <div className="p-3">
                <Calendar
                  mode="single"
                  numberOfMonths={1}
                  selected={tempDate}
                  onSelect={(date) => {
                    if (!date) return;
                    setTempDate(date);
                    setValue(new Date(date).toISOString()); // 👈 saves with timezone
                    close();
                  }}
                  disabled={[{ after: today }]}
                  className="rounded-md text-textBody"
                />
              </div>
            </PopoverPanel>
          </>
        )}
      </Popover>
    </div>
  );
};

export default DatePicker;
