"use client";

import React from "react";
import Loading from "../Loading";
import { cn } from "@/utils/style";
import { Schedule } from "@/models";

interface IScheduleInfo {
  schedule: Schedule;
  isLoading?: boolean;
  onClose: (isRefresh?: boolean) => void;
}

const ScheduleInfo = ({ schedule, isLoading, onClose }: IScheduleInfo) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeSlot = (slot: any) => {
    if (slot.span) {
      const start = slot.span.start;
      const end = slot.span.end;
      const startTime = `${start.hour
        .toString()
        .padStart(2, "0")}:${start.minute.toString().padStart(2, "0")}`;
      const endTime = `${end.hour.toString().padStart(2, "0")}:${end.minute
        .toString()
        .padStart(2, "0")}`;
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const startDay = dayNames[start.day];
      const endDay = start.day !== end.day ? ` - ${dayNames[end.day]}` : "";
      return `${startDay}${endDay}: ${startTime} - ${endTime}`;
    }

    // Legacy format
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = dayNames[slot.day_of_week || 0];
    const startTime = slot.start_time || "08:00:00";
    const endTime = slot.end_time || "09:00:00";
    return `${dayName}: ${startTime.substring(0, 5)} - ${endTime.substring(
      0,
      5
    )}`;
  };

  return (
    <div className="relative flex-1">
      <div className="relative flex flex-col gap-4 overflow-y-auto p-1 text-textBody">
        {/* Basic Information */}
        <table
          className={cn(
            "min-w-60 text-sm border-collapse flex-1 rounded-sm overflow-hidden",
            "shadow-md shadow-primary/50"
          )}
        >
          <thead>
            <tr>
              <th
                colSpan={2}
                className="bg-primary/10 px-3 py-2 text-left font-medium text-primary"
              >
                Schedule Details
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-1 font-semibold">Schedule ID</td>
              <td className="px-3 py-1">{schedule.schedule_id}</td>
            </tr>
            <tr>
              <td className="px-3 py-1 font-semibold">Schedule Name</td>
              <td className="px-3 py-1">{schedule.name}</td>
            </tr>
            <tr>
              <td className="px-3 py-1 font-semibold">User Type</td>
              <td className="px-3 py-1">{schedule.user_type}</td>
            </tr>
            <tr>
              <td className="px-3 py-1 font-semibold">Description</td>
              <td className="px-3 py-1">{schedule.description}</td>
            </tr>
            <tr>
              <td className="px-3 py-1 font-semibold">Created At</td>
              <td className="px-3 py-1">{formatDate(schedule.created_at)}</td>
            </tr>
          </tbody>
        </table>

        {/* Time Slots */}
        <table
          className={cn(
            "min-w-60 text-sm border-collapse flex-1 rounded-sm overflow-hidden",
            "shadow-md shadow-primary/50",
            "min-h-32"
          )}
        >
          <thead>
            <tr>
              <th
                colSpan={2}
                className="bg-primary/10 px-3 py-2 text-left font-medium text-primary"
              >
                Time Blocks
              </th>
            </tr>
          </thead>
          <tbody>
            {schedule.slots.map((slot, index) => (
              <tr key={index}>
                <td className="px-3 py-1 font-semibold">
                  <span className="ml-2 text-primary/70">
                    {slot.label?.length ? slot.label : "Unlabeled"}
                  </span>
                </td>
                <td className="px-3 py-1">
                  <div className="text-sm">{formatTimeSlot(slot)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && (
          <div
            className={cn(
              "absolute z-30 h-full w-full rounded-lg",
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

export default ScheduleInfo;
