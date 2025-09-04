import { cn } from "@/utils/style";
import { SelectHTMLAttributes } from "react";

interface ISelect extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = ({ className, ...props }: ISelect) => {
  return (
    <select
      className={cn(
        "w-auto min-w-44",
        "p-1 px-4 rounded-md shadow-base",
        "transition-all transform hover:brightness-110",
        "border border-textBody w-full rounded-lg p-2",
        "text-uGrayLight text-base",
        className
      )}
      {...props}
    >
      {props.children}
    </select>
  );
};

export default Select;
