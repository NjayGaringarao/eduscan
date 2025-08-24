import { cn } from "@/utils/style";
import { LucideProps, SquareUserRound, User2 } from "lucide-react";
import React, { ForwardRefExoticComponent, RefAttributes } from "react";

interface ICard {
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  title: string;
  value: number;
}

const Card = ({ Icon, title, value }: ICard) => {
  return (
    <div
      className={cn(
        "relative h-48 w-72 rounded-xl p-6 group shadow-lg shrink-0",
        "transition-transform duration-200 hover:scale-105",
        "bg-background/70 backdrop-blur-lg border border-primary/20",
        "flex flex-row items-center gap-4"
      )}
    >
      <div className="flex items-center justify-center p-4 rounded-full bg-background">
        <Icon className={cn("text-primary")} strokeWidth={3} size={36} />
      </div>
      <div className="flex flex-col flex-1">
        <p className="text-primary text-lg font-medium">{title}</p>
      </div>
      <p
        className={cn("absolute right-6 bottom-6", "text-primary/90 text-4xl")}
      >
        {value}
      </p>
    </div>
  );
};

export const CurrentStatus = () => {
  return (
    <div
      className={cn(
        "flex flex-row gap-6 ",
        "w-full overflow-x-auto overflow-y-hidden p-2"
      )}
      style={{
        scrollbarColor: "var(--color-primary) var(--color-background) ", // Example: thumb color and track color
      }}
    >
      <Card Icon={SquareUserRound} title="Inside the Campus" value={25} />
      <Card Icon={User2} title="Total User" value={25} />
    </div>
  );
};
