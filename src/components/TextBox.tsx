"use client";

import { cn } from "@/utils/style";
import { Eye, EyeClosed } from "lucide-react";
import { useEffect, useState } from "react";

interface ITextBox {
  title?: string;
  value: string;
  setValue: (param: string) => void;
  containerClassName?: string;
  inputClassName?: string;
  titleClassName?: string;
  isPassword?: boolean;
  placeHolder?: string;
  isValueInvalid?: boolean;
  isRequired?: boolean;
  isUpperCase?: boolean;
  disabled?: boolean;
  maxLength?: number;
}

const TextBox = ({
  title,
  value,
  setValue,
  containerClassName,
  inputClassName,
  titleClassName,
  isPassword,
  placeHolder,
  isUpperCase = false,
  isRequired = false,
  isValueInvalid = false,
  disabled = false,
  maxLength,
}: ITextBox) => {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (isPassword) setIsHidden(true);
  }, [isPassword]);

  const handleOnBlur = () => {
    if (isUpperCase) {
      setValue(value.toLocaleUpperCase().trim());
    } else {
      setValue(value.trim());
    }
  };

  return (
    <div className={cn("relative", containerClassName)}>
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

      <div className="relative flex-1">
        <input
          type={isHidden ? "password" : "text"}
          className={cn(
            "border border-textBody w-full rounded-lg p-2 focus:border-2 hover:border-2 text-primary font-mono",
            inputClassName,
            isValueInvalid &&
              "border-error/50 focus:border-error hover:border-error/90",
            isPassword && "pr-12",
            disabled && "cursor-not-allowed"
          )}
          value={value ?? ""}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeHolder}
          onBlur={handleOnBlur}
          disabled={disabled}
          maxLength={maxLength} // ✅ applied here
        />
        {isPassword && (
          <button
            type="button"
            className="absolute bottom-0 top-0 right-4 flex flex-col justify-center"
            onClick={() => setIsHidden((prev) => !prev)}
          >
            {isHidden ? (
              <EyeClosed className="text-textBody" />
            ) : (
              <Eye className="text-textBody" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TextBox;
