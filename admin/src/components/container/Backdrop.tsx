import { cn } from "@/utils/style";
import React from "react";

interface IBackdrop {
  containerClassName?: string;
  children?: React.ReactNode;
}

const Backdrop = ({ containerClassName, children }: IBackdrop) => {
  return (
    <div
      className={cn(
        "border border-textBody/20 bg-background/30 rounded-xl backdrop-blur-sm",
        "p-4 flex gap-4 md:p-6 md:gap-6",
        containerClassName
      )}
    >
      {children}
    </div>
  );
};

export default Backdrop;
