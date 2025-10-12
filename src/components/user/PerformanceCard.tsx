import { cn } from "@/utils/style";
import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { Loading } from "../Loading";

interface IPerformanceCard {
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  title: string;
  value: string;
  containerClassName?: string;
  isLoading?: boolean;
}

export const PerformanceCard = ({
  Icon,
  title,
  value,
  containerClassName,
  isLoading,
}: IPerformanceCard) => {
  return (
    <div
      className={cn(
        "relative rounded-xl group shadow-lg overflow-hidden",
        "bg-background/70 backdrop-blur-lg border border-primary/20",
        "flex flex-col items-center",
        "hover:bg-background/90",
        containerClassName
      )}
    >
      {isLoading ? (
        <div
          className={cn(
            "flex-1 w-full rounded-lg left-0",
            "flex flex-col items-center justify-center"
          )}
        >
          <Loading />
        </div>
      ) : (
        <div className="w-full flex-1 flex flex-row gap-4 items-center p-4 mt-4">
          <div className="flex items-center justify-center p-2 rounded-full bg-primary/80">
            <Icon className={cn("text-secondary")} strokeWidth={3} size={20} />
          </div>
          <div className="flex flex-col flex-1">
            <p className="text-primary text-lg font-medium">{value}</p>
          </div>
        </div>
      )}

      <div className="flex flex-row justify-between items-center bg-textBody w-full px-4 py-2">
        <p className={cn("text-background text-base")}>{title}</p>
      </div>
    </div>
  );
};
