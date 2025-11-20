import { cn } from "@/utils/style";
import { LucideProps, ChevronDown } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes, useState } from "react";
import { Loading } from "../Loading";

interface IPerformanceCard {
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  title: string;
  value: string;
  subtitle?: string;
  badge?: {
    icon: ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >;
    color: "green" | "red" | "yellow" | "blue";
  };
  expandable?: {
    title: string;
    content: React.ReactNode;
  };
  containerClassName?: string;
  valueClassName?: string;
  isLoading?: boolean;
}

export const PerformanceCard = ({
  Icon,
  title,
  value,
  subtitle,
  badge,
  expandable,
  containerClassName,
  valueClassName,
  isLoading,
}: IPerformanceCard) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const badgeColors = {
    green: "bg-green-500/20 text-green-600",
    red: "bg-red-500/20 text-red-600",
    yellow: "bg-yellow-500/20 text-yellow-600",
    blue: "bg-blue-500/20 text-blue-600",
  };

  return (
    <div
      className={cn(
        "relative rounded-xl group shadow-lg overflow-hidden",
        "bg-background/70 backdrop-blur-lg border border-primary/20",
        "flex flex-col",
        "hover:bg-background/90 transition-all",
        "min-h-36",
        containerClassName
      )}
    >
      {isLoading ? (
        <div className="flex-1 w-full flex items-center justify-center p-4 min-h-[100px]">
          <Loading />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center">
          <div className="w-full flex flex-row gap-4 items-center p-4">
            <div className="flex items-center justify-center p-2 rounded-full bg-primary/80 shrink-0">
              <Icon className="text-secondary" strokeWidth={3} size={20} />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <p
                className={cn(
                  "text-primary text-lg font-medium truncate",
                  valueClassName
                )}
              >
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-textBody/80 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {badge && (
              <div
                className={cn(
                  "p-1.5 rounded-full shrink-0",
                  badgeColors[badge.color]
                )}
              >
                <badge.icon size={16} strokeWidth={2.5} />
              </div>
            )}
          </div>

          {expandable && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-textBody/80 w-full px-4 py-2 bg-muted/50 flex items-center justify-between hover:bg-muted/70 transition-colors text-left"
              >
                <span className="text-xs font-medium">{expandable.title}</span>
                <ChevronDown
                  className={cn(
                    "transition-transform shrink-0",
                    isExpanded && "rotate-180"
                  )}
                  size={16}
                />
              </button>

              {isExpanded && (
                <div className="text-textBody/80 px-4 py-3 bg-muted/30 text-sm">
                  {expandable.content}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex flex-row justify-between items-center bg-textBody w-full px-4 py-2 ">
        <p className="text-background text-base">{title}</p>
      </div>
    </div>
  );
};
