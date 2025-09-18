import { SystemLog } from "@/models";
import { cn } from "@/utils/style";
import { formatDateToMMDDYY, formatTime } from "@/utils/time";
import React, { useState } from "react";

interface ILogItem {
  log: SystemLog;
}

const LogItem = ({ log }: ILogItem) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      className={cn(
        "relative w-full py-4 px-2",
        "border-b border-primary/20",
        "flex flex-row gap-4 justify-between",
        "cursor-pointer transition-all"
      )}
      onClick={() => setExpanded((prev) => !prev)}
      title={
        !expanded ? "Click to show description" : "Click to hide description"
      }
    >
      <div className="flex-1 min-w-0">
        <p className="text-start text-primary text-base">{log.title}</p>
        <div
          className={cn(
            "text-start text-textBody text-sm",
            "hidden",
            expanded && "flex flex-col gap-0"
          )}
        >
          <div className="flex flex-row gap-1">
            <p className="w-20">Description</p>
            <p>{": ".concat(log.description)}</p>
          </div>
          <div className="flex flex-row gap-1">
            <p className="w-20">Log Type</p>
            <p>{": ".concat(log.type)}</p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "text-sm text-textBody whitespace-nowrap",
          "flex flex-col-reverse md:flex-row md:gap-2 "
        )}
      >
        <p>{formatTime(new Date(log.timestamp).toISOString())}</p>
        <p>{formatDateToMMDDYY(new Date(log.timestamp))}</p>
      </div>
    </button>
  );
};

export default LogItem;
