"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";
import { cn } from "@/utils/style";

interface RadioGroupProps
  extends React.ComponentProps<typeof RadioGroupPrimitive.Root> {
  title?: string;
  value: string;
  setValue: (value: string) => void;
  isRequired?: boolean;
  isValueInvalid?: boolean;
  disabled?: boolean;
}

function RadioGroup({
  className,
  title,
  value,
  setValue,
  isRequired = false,
  isValueInvalid = false,
  disabled,
  ...props
}: RadioGroupProps) {
  return (
    <div className="flex flex-col ">
      {title && (
        <div className="text-base text-textBody flex flex-row gap-2">
          <p>{title} </p>{" "}
          {isRequired === true && <p className="text-error"> *</p>}
        </div>
      )}

      <div className="relative">
        <RadioGroupPrimitive.Root
          data-slot="radio-group"
          className={cn(
            "grid gap-6 h-auto border text-primary border-textBody rounded-lg px-4 py-2",
            className,
            isValueInvalid && "border-error/50 hover:border-error"
          )}
          value={value}
          onValueChange={setValue}
          {...props}
        />
        {disabled && (
          <div className="absolute h-full w-full top-0 rounded-lg cursor-not-allowed" />
        )}
      </div>
    </div>
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "border-textBody text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square",
        "size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none",
        "focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
