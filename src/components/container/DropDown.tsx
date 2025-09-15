"use client";

import { cn } from "@/utils/style";
import { ChevronRight, ChevronUp } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";

interface IDropDown {
  headerElement: React.ReactNode;
  children: React.ReactNode;
  containerClassName?: string;
  childClassName?: string;
  isDefaultOpen?: boolean;
  useBackDrop?: boolean;
}

const DropDown = ({
  headerElement,
  children,
  containerClassName,
  childClassName,
  isDefaultOpen = false,
  useBackDrop = false,
}: IDropDown) => {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const updateHeight = () => {
      if (isOpen) setHeight(el.scrollHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  return (
    <div
      className={cn(
        "flex flex-col",
        useBackDrop &&
          "border border-textBody/20 p-4 bg-background/30 rounded-xl backdrop-blur-sm",
        containerClassName
      )}
    >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn("flex flex-row gap-4 items-center text-textBody")}
      >
        {isOpen ? <ChevronUp /> : <ChevronRight />}
        {headerElement}
      </button>

      <div
        style={{
          height: isOpen ? height : 0,
          transition: "height 0.3s ease",
        }}
        className={cn("pl-10 ", isOpen ? "mt-4" : "overflow-hidden")}
      >
        <div className={childClassName} ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DropDown;
