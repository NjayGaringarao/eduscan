import { cn } from "@/utils/style";
import React from "react";

interface IBox {
  children: React.ReactNode;
  containerClassName?: string;
}

const Box = ({ children, containerClassName }: IBox) => {
  return (
    <div
      className={cn(
        "relative w-full rounded-xl p-4",
        "bg-background/70 backdrop-blur-lg border border-primary/20",
        containerClassName
      )}
    >
      {children}
    </div>
  );
};

export default Box;
