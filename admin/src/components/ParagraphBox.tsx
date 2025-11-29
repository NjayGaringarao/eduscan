"use client";

import { cn } from "@/utils/style";
import { InputHTMLAttributes } from "react";

interface IParagraphBox extends InputHTMLAttributes<HTMLTextAreaElement> {
  title?: string;
  value: string;
  setValue: (param: string) => void;
  containerClassName?: string;
  inputClassName?: string;
  titleClassName?: string;
  isValueInvalid?: boolean;
  isRequired?: boolean;
  disabled?: boolean;
}

const ParagraphBox = ({
  title,
  value,
  setValue,
  containerClassName,
  inputClassName,
  titleClassName,
  isRequired = false,
  isValueInvalid = false,
  disabled = false,
  ...textAreaProp
}: IParagraphBox) => {
  return (
    <div className={cn("relative flex flex-col", containerClassName)}>
      {title && (
        <div
          className={cn(
            "text-base text-textBody flex flex-row gap-2",
            titleClassName
          )}
        >
          <p>{title} </p>
          {isRequired === true && <p className="text-error"> *</p>}
        </div>
      )}

      <textarea
        className={cn(
          "resize-none break-all break-words whitespace-pre-wrap",
          "border border-textBody w-full rounded-lg p-2 focus:border-2 hover:border-2",
          "text-primary font-mono",
          inputClassName,
          isValueInvalid &&
            "border-error/50 focus:border-error hover:border-error/90",
          disabled && "cursor-not-allowed"
        )}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        {...textAreaProp}
      />
    </div>
  );
};

export default ParagraphBox;
