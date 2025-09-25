import { cn } from "@/utils/style";
import React from "react";

type SwitchSize = "small" | "medium" | "large";

interface SwitchProps {
  isOn: boolean;
  setIsOn?: (value: boolean) => void;
  size?: SwitchSize;
  disabled?: boolean;
  className?: string;
}

const sizeClasses: Record<
  SwitchSize,
  { track: string; knob: string; translate: string }
> = {
  small: {
    track: "w-8 h-4 rounded-full",
    knob: "w-3 h-3 top-[1px] left-[2px]",
    translate: "translate-x-4",
  },
  medium: {
    track: "w-12 h-6 rounded-full",
    knob: "w-5 h-5 top-[1px] left-[2px]",
    translate: "translate-x-6",
  },
  large: {
    track: "w-16 h-8 rounded-full",
    knob: "w-7 h-7 top-[1px] left-[2px]",
    translate: "translate-x-8",
  },
};

export const Switch: React.FC<SwitchProps> = ({
  isOn,
  setIsOn = () => {},
  size = "medium",
  disabled,
  className,
}) => {
  const handleClick = () => {
    if (!disabled) setIsOn(!isOn);
  };

  const { track, knob, translate } = sizeClasses[size];

  return (
    <div
      className={cn(
        "relative cursor-pointer transition-colors duration-200 outline-none",
        "border border-primary/30",
        track,
        isOn ? "bg-primary" : "bg-primary/20",
        disabled && "cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      role="switch"
      aria-checked={isOn}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className={`absolute bg-background rounded-full shadow-primary/50 shadow-[0_0_8px_2px_var(--tw-shadow-color)] transition-transform duration-200 ${knob} ${
          isOn ? translate : ""
        }`}
      />
    </div>
  );
};
