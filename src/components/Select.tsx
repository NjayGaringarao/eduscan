import { cn } from "@/utils/style";
import { SelectHTMLAttributes } from "react";

const Select = ({
  className,
  disabled,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) => {
  return (
    <select
      className={cn(
        "w-auto min-w-44",
        "p-1 px-4 rounded-lg shadow-lg",
        "transition-all transform hover:brightness-110",
        "border border-primary w-full rounded-lg p-2",
        "text-uGrayLight text-base",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {props.children}
    </select>
  );
};

export default Select;
