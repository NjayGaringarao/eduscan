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
    <div
      className={cn(
        "relativeflex flex-col md:flex-row lg:flex-col gap-2 text-textBody"
      )}
    >
      {/* Basic Information */}
      <div>
        <p className="text-lg font-medium text-primary border-b border-primary pb-1">
          Metadata
        </p>
        <table
          className={cn(
            "min-w-60 text-sm border-collapse flex-1 rounded-sm overflow-hidden"
          )}
        >
          <tbody>
            <tr className="h-10">
              <td className="px-4 font-medium">ID</td>
              <td className="px-4">{schedule.id}</td>
            </tr>
            <tr className="h-10">
              <td className="px-4 font-medium">Name</td>
              <td className="px-4">{schedule.name}</td>
            </tr>
            <tr className="h-10">
              <td className="px-4 font-medium">User Type</td>
              <td className="px-4">{schedule.user_type}</td>
            </tr>
            <tr className="h-10">
              <td className="px-4 font-medium">Description</td>
              <td className="px-4">{schedule.description}</td>
            </tr>
            <tr className="h-10">
              <td className="px-4 font-medium">Created</td>
              <td className="px-4">{formatDate(schedule.created_at)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Time Blocks */}
      <p className="text-lg font-medium text-primary border-b border-primary pb-1 bg-background sticky top-0 z-20">
        Time Blocks
      </p>
      <div className="h-72 overflow-y-auto">
        <table
          className={cn(
            "min-w-60 text-sm border-collapse flex-1 overflow-hidden"
          )}
        >
          <tbody>
            {schedule.slots.map((slot, index) => (
              <tr className="h-10" key={index}>
                {schedule.user_type === "STUDENT" && (
                  <td className="px-4 font-medium">
                    <span>{slot.label?.length ? slot.label : "Unlabeled"}</span>
                  </td>
                )}
                <td className="px-4">
                  <div>{formatDay(slot.day_of_week)}</div>
                </td>
                <td className="px-4">
                  <div>{formatTime(slot.start_time, slot.end_time)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
  );
};

export default ScheduleInfo;
