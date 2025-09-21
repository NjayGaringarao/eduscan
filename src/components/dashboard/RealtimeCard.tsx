import { cn } from "@/utils/style";
import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { Loading } from "../Loading";

interface ICard {
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  title: string;
  value: string;
  containerClassName?: string;
  isLoading?: boolean;
}

export const RealtimeCard = ({
  Icon,
  title,
  value,
  containerClassName,
  isLoading,
}: ICard) => {
  return (
    <div
      className={cn(
        "relative h-48 rounded-xl p-6 group shadow-lg shrink-0",
        "bg-background/70 backdrop-blur-lg border border-primary/20",
        "flex flex-row items-center gap-4",
        "hover:bg-background/90",
        containerClassName
      )}
    >
      <div className="flex items-center justify-center p-4 rounded-full bg-background">
        <Icon className={cn("text-primary")} strokeWidth={3} size={36} />
      </div>
      <div className="flex flex-col flex-1">
        <p className="text-primary text-4xl font-medium">{value}</p>
      </div>
      <p className={cn("absolute right-6 bottom-6", "text-primary/80 text-lg")}>
        {title}
      </p>
      {isLoading && (
        <div
          className={cn(
            "absolute z-30 h-full w-full rounded-lg left-0",
            "bg-background",
            "flex flex-col items-center justify-center"
          )}
        >
          <Loading />
        </div>
      )}
    </div>
  );
};
