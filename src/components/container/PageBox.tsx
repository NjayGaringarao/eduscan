import { cn } from "@/utils/style";
import { ReactNode } from "react";

interface IPageBox {
  className?: string;
  children: ReactNode;
}

const PageBox = ({ className, children }: IPageBox) => {
  return (
    <div
      className={cn(
        "w-full max-w-7xl py-2 mb-24 md:m-0 md:p-6 h-full",
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageBox;
