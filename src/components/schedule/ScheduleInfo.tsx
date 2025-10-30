"use client";

import React from "react";
import Loading from "../Loading";
import { cn } from "@/utils/style";
import { Schedule } from "@/models";
import { convertTo12Hour } from "@/utils/time";

interface IScheduleInfo {
  schedule: Schedule;
  isLoading?: boolean;
}

const ScheduleInfo = ({ schedule, isLoading }: IScheduleInfo) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (start_time: string, end_time: string) => {
    return `${convertTo12Hour(start_time)} - ${convertTo12Hour(end_time)}`;
  };

  const formatDay = (day: number) => {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return dayNames[day];
  };

  return (
    <div className="relative flex-1">
      <div className="relative flex flex-col md:flex-row lg:flex-col gap-4 overflow-y-auto p-1 text-textBody">
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
              <td className="px-3 py-1">{schedule.id}</td>
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
                colSpan={3}
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
                  <div className="text-sm">{formatDay(slot.day_of_week)}</div>
                </td>
                <td className="px-3 py-1">
                  <div className="text-sm">
                    {formatTime(slot.start_time, slot.end_time)}
                  </div>
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
