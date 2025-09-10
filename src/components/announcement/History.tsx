"use client";

import React, { useState } from "react";
import HistoryItem from "./HistoryItem";
import { Announcement } from "@/models";
import { cn } from "@/utils/style";

const History = () => {
  const [historyList, setHistoryList] = useState<Announcement[]>([]);
  return (
    <div className="flex flex-col gap-2">
      {historyList.length === 0 && (
        <div
          className={cn(
            "w-full h-56 flex items-center justify-center",
            "relative w-full rounded-xl p-4",
            "bg-background/70 backdrop-blur-lg border border-primary/20"
          )}
        >
          <p className="text-primary text-2xl">No Announcement Yet</p>
        </div>
      )}
      {historyList.length > 0 && (
        <>
          {historyList.map((item) => (
            <HistoryItem key={item.announcement_id} announcement={item} />
          ))}
        </>
      )}
    </div>
  );
};

export default History;
