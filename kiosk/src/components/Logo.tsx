"use client";

import useDarkMode from "@/hooks/useDarkMode";
import { cn } from "@/utils/style";

interface ILogo {
  className?: string;
}

export function Logo({ className }: ILogo) {
  const isDarkMode = useDarkMode();
  return (
    <img
      src={
        isDarkMode ? "/image/eduscan-logo-dark.png" : "/image/eduscan-logo.png"
      }
      alt="Logo"
      width={512}
      height={512}
      className={cn("items-center w-80", className)}
    />
  );
}
