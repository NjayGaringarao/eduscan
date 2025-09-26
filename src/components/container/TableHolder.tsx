import { cn } from "@/utils/style";
import { ReactNode } from "react";

interface ITableHolder {
  className?: string;
  children: ReactNode;
}

const TableHolder = ({ className, children }: ITableHolder) => {
  return (
    <div
      className={cn(
        "w-full border border-primary/40 rounded-md",
        "flex-col overflow-auto ",
        className
      )}
    >
      {children}
    </div>
  );
};

export default TableHolder;
