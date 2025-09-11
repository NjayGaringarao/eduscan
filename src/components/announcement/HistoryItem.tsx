import { Announcement } from "@/models";
import { cn } from "@/utils/style";
import { formatDateToMMDDYY } from "@/utils/time";
import React, { useState } from "react";

interface IHistoryItem {
  announcement: Announcement;
}

const HistoryItem = ({
  announcement: { title, message, recipient, created_at },
}: IHistoryItem) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      className={cn(
        "relative w-full py-4",
        "border-b border-primary/20",
        "flex flex-row gap-4 justify-between",
        "cursor-pointer transition-all"
      )}
      onClick={() => setExpanded((prev) => !prev)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-start text-primary text-base">
          {title} [{recipient}]
        </p>
        <p
          className={cn(
            "text-start text-textBody text-sm",
            !expanded && "truncate"
          )}
          title={!expanded ? "Click to expand" : "Click to collapse"}
        >
          {message}
        </p>
      </div>

      <p className="text-base text-textBody whitespace-nowrap">
        {formatDateToMMDDYY(new Date(created_at))}
      </p>
    </button>
  );
};

export default HistoryItem;
