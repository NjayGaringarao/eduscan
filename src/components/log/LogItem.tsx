import { AttendanceLog, SystemLog } from "@/models";
import { cn } from "@/utils/style";
import { formatDateToMMDDYY, formatTime } from "@/utils/time";
import React, { useState } from "react";

interface ILogItem {
  log: SystemLog | AttendanceLog;
}

const LogItem = ({ log }: ILogItem) => {
  const [expanded, setExpanded] = useState(false);

  // Determine if it's a SystemLog or AttendanceLog based on available properties
  const isSystemLog = "type" in log && "description" in log;
  const isAttendanceLog = "action" in log && "user_id" in log;

  // Construct title and message based on log type
  const getTitle = () => {
    if (isSystemLog) {
      return log.title;
    } else if (isAttendanceLog) {
      return `User ${log.user_id} ${
        log.action === "TIME_IN" ? "Time In" : "Time Out"
      }`;
    }
    return "Log Entry";
  };

  const getMessage = () => {
    if (isSystemLog) {
      return log.description || "No description available";
    } else if (isAttendanceLog) {
      return `A user with user id: ${log.user_id ?? "Unknown"} went ${
        log.action === "TIME_IN" ? "inside" : "outside"
      } the premises of PRMSU - Castillejos campus.`;
    }
    return "No details available";
  };

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
        <p className="text-start text-primary text-base">{getTitle()}</p>
        <p
          className={cn(
            "text-start text-textBody text-sm hidden",
            expanded && "block"
          )}
        >
          {getMessage()}
        </p>
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
