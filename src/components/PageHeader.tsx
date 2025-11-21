"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/utils/style";
import { ArrowLeft, ChevronRight } from "lucide-react";
import React from "react";

interface IPageHeader {
  title: string;
  allowBack?: boolean;
  isSticky?: boolean;
}

const PageHeader = ({ title, allowBack, isSticky = true }: IPageHeader) => {
  const router = useRouter();
  return (
    <div
      className={cn(
        isSticky && "sticky top-0 z-50",
        "p-4",
        "bg-background/60 backdrop-blur-sm rounded-xl",
        "flex flex-row gap-4 items-center"
      )}
    >
      {allowBack ? (
        <button
          className={cn(
            "rounded-lg",
            "hover:shadow-[0_0_4px_1px_var(--tw-shadow-color)] hover:shadow-primary/70 hover:scale-102 ",
            "transition-all transform duration-200",
            "text-base font-semibold",
            "flex flex-row gap-2 items-center justify-center"
          )}
          onClick={() => router.back()}
        >
          <ArrowLeft strokeWidth={3} className="text-background h-10 w-10" />
        </button>
      ) : (
        <div
          className={cn(
            "text-base font-semibold",
            "flex flex-row gap-2 items-center justify-center"
          )}
        >
          <ChevronRight strokeWidth={3} className="text-primary h-10 w-10" />
        </div>
      )}

      <p className={cn("text-primary text-3xl font-bold")}>{title}</p>
    </div>
  );
};

export default PageHeader;
