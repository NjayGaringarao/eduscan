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
        "border border-textBody/20 p-4 bg-background/30 rounded-xl backdrop-blur-sm",
        containerClassName
      )}
    >
      {children}
    </div>
  );
};

export default Backdrop;
