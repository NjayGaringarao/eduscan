"use client";
import { cn } from "@/utils/style";
import { ChangeEvent } from "react";

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
  placeHolder,
  isRequired = false,
  isValueInvalid = false,
  disabled = false,
}: IDatePicker) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className={cn("relative", containerClassName)}>
      {title && (
        <div className="text-base text-textBody flex flex-row gap-2">
          <p>{title} </p>
          {isRequired === true && <p className="text-error"> *</p>}
        </div>
      )}
      <input
        type="date"
        className={cn(
          "border border-textBody w-full rounded-lg p-2 focus:border-2 hover:border-2 text-primary font-mono",
          inputClassName,
          isValueInvalid && "border-error/50 hover:border-error"
        )}
        value={value}
        onChange={handleChange}
        placeholder={placeHolder}
        min={
          new Date(new Date().setFullYear(new Date().getFullYear() - 120))
            .toISOString()
            .split("T")[0]
        }
        max={
          new Date(new Date().setFullYear(new Date().getFullYear() - 15))
            .toISOString()
            .split("T")[0]
        }
        disabled={disabled}
      />
    </div>
  );
};

export default DatePicker;
