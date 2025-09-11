"use client";

import React, { useEffect, useState, useMemo } from "react";
import HistoryItem from "./HistoryItem";
import { Announcement } from "@/models";
import { cn } from "@/utils/style";
import Loading from "../Loading";
import * as announcement from "@/lib/announcement";
import Select from "../Select";
import DateRangePicker from "../DateRangePicker";

const History = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [historyList, setHistoryList] = useState<Announcement[]>([]);

  // --- Default dates: first day of current month -> today ---
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [fromDate, setFromDate] = useState(
    firstDayOfMonth.toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(today.toISOString().split("T")[0]);

  const [role, setRole] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      const { announcements, error } = await announcement.getAll();
      if (!error) {
        setHistoryList(announcements);
      } else {
        console.error("Error fetching announcements:", error);
      }
      setIsLoading(false);
    };

    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    let list = [...historyList];

    // filter by role
    if (role !== "ALL") {
      list = list.filter((item) => item.recipient === role);
    }

    // filter by date range
    if (fromDate) {
      list = list.filter(
        (item) => new Date(item.created_at) >= new Date(fromDate + "T00:00:00")
      );
    }
    if (toDate) {
      list = list.filter(
        (item) => new Date(item.created_at) <= new Date(toDate + "T23:59:59")
      );
    }

    // sort
    list.sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return sortOrder === "DESC" ? bDate - aDate : aDate - bDate;
    });

    return list;
  }, [historyList, fromDate, toDate, role, sortOrder]);

  return (
    <div className="flex flex-col gap-4 relative">
      {/* Filter Controls */}
      <div
        className={cn(
          "grid grid-rows-2 gap-2",
          "2xl:flex 2xl:flex-row 2xl:gap-4 2xl:items-center",
          "border rounded-lg p-4 border-primary/20 bg-background/70 backdrop-blur-lg"
        )}
      >
        <DateRangePicker
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
        />

        <div className="flex flex-row gap-2">
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="text-lg text-primary bg-background/50 flex-1"
            title="Recipient"
            disabled={isLoading}
          >
            <option value="ALL">Recieved by all Users</option>
            <option value="GUARDIAN">Recieved by Guardians</option>
            <option value="EMPLOYEE">Recieved by Employees</option>
          </Select>

          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "DESC" | "ASC")}
            className="text-lg text-primary bg-background/50 flex-1 "
            disabled={isLoading}
          >
            <option value="DESC">Newest First</option>
            <option value="ASC">Oldest First</option>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div
        className={cn(
          "relative w-full rounded-xl p-4",
          "bg-background/70 backdrop-blur-lg border border-primary/20",
          "flex flex-col",
          "cursor-pointer transition-all"
        )}
      >
        {filteredHistory.length === 0 && !isLoading && (
          <div
            className={cn(
              "w-full h-56 flex items-center justify-center",
              "relative w-full rounded-xl p-4",
              "bg-background/70 backdrop-blur-lg border border-primary/20"
            )}
          >
            <p className="text-primary text-2xl">No Announcement Found</p>
          </div>
        )}

        {filteredHistory.length > 0 && (
          <>
            {filteredHistory.map((item) => (
              <HistoryItem key={item.announcement_id} announcement={item} />
            ))}
          </>
        )}

        {isLoading && (
          <div
            className={cn(
              "h-full w-full rounded-lg py-6",
              "bg-background/10 backdrop-blur-xs",
              "flex flex-col items-center justify-center"
            )}
          >
            <Loading prompt="Please wait..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
