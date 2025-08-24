"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { cn } from "@/utils/style";
import { TrendPoint } from "@/types";
import { getAttendanceTrend } from "@/lib/home";

// Generate hours in 24h values, but with 12h labels
const hours = Array.from({ length: 24 }, (_, h) => {
  const hour12 = ((h + 11) % 12) + 1; // convert to 12-hour
  const ampm = h < 12 ? "AM" : "PM";
  const value = `${String(h).padStart(2, "0")}:00`; // backend (24h)
  const label = `${hour12}:00 ${ampm}`; // frontend (12h)
  return { value, label };
});

export const AttendanceTrend = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("08:00"); // stored as 24h
  const [endTime, setEndTime] = useState("17:00");
  const [data, setData] = useState<TrendPoint[]>([]);

  const fetchData = async () => {
    const { trend, error } = await getAttendanceTrend(date, startTime, endTime);
    if (error) alert(error);
    setData(trend);
  };

  useEffect(() => {
    fetchData();
  }, [date, startTime, endTime]);

  // Ensure valid range
  const updateRange = (type: "start" | "end", value: string) => {
    const values = hours.map((h) => h.value);
    if (type === "start") {
      if (value >= endTime) {
        setEndTime(
          values[Math.min(values.indexOf(value) + 1, values.length - 1)]
        );
      }
      setStartTime(value);
    } else {
      if (value <= startTime) {
        setStartTime(values[Math.max(values.indexOf(value) - 1, 0)]);
      }
      setEndTime(value);
    }
  };

  // Format display (find label by value)
  const formatTime = (value: string) =>
    hours.find((h) => h.value === value)?.label ?? value;

  return (
    <div className="flex-1 p-2">
      <div
        className={cn(
          "w-full p-6 rounded-2xl border border-primary/20",
          "transition-transform duration-200 hover:scale-[1.01]",
          "bg-background/70 backdrop-blur-lg"
        )}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 w-full">
          <h2 className="text-primary text-lg font-medium">
            User Attendance Trend
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Picker */}
            <Popover className="relative">
              <PopoverButton
                className={cn(
                  "px-3 py-2 rounded-lg border border-primary text-primary flex items-center gap-2",
                  "hover:bg-primary/10 transition"
                )}
              >
                <CalendarIcon className="w-4 h-4" />
                {date.toDateString()}
              </PopoverButton>
              <PopoverPanel className="absolute right-0 z-50 mt-2 rounded-md border bg-background shadow-lg">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  className="rounded-md text-textBody"
                />
              </PopoverPanel>
            </Popover>

            {/* Time Range Picker */}
            <Popover className="relative">
              <PopoverButton
                className={cn(
                  "px-3 py-2 rounded-lg border border-primary text-primary flex items-center gap-2",
                  "hover:bg-primary/10 transition"
                )}
              >
                <Clock className="w-4 h-4" />
                {formatTime(startTime)} – {formatTime(endTime)}
              </PopoverButton>
              <PopoverPanel className="absolute right-0 z-50 mt-2 rounded-md border bg-background shadow-lg flex gap-4 p-4">
                {/* Start time list */}
                <div>
                  <p className="text-xs text-textBody mb-1">Start</p>
                  <ul className="max-h-48 overflow-y-auto w-28">
                    {hours.map((h) => (
                      <li
                        key={`start-${h.value}`}
                        className={cn(
                          "px-3 py-2 hover:bg-primary/10 text-textBody cursor-pointer",
                          startTime === h.value && "bg-primary/20"
                        )}
                        onClick={() => updateRange("start", h.value)}
                      >
                        {h.label}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* End time list */}
                <div>
                  <p className="text-xs text-textBody mb-1">End</p>
                  <ul className="max-h-48 overflow-y-auto w-28">
                    {hours.map((h) => (
                      <li
                        key={`end-${h.value}`}
                        className={cn(
                          "px-3 py-2 hover:bg-primary/10 text-textBody cursor-pointer",
                          endTime === h.value && "bg-primary/20"
                        )}
                        onClick={() => updateRange("end", h.value)}
                      >
                        {h.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </PopoverPanel>
            </Popover>
          </div>
        </div>

        {/* Chart */}
        <div className="flex flex-col gap-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <XAxis dataKey="hour" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
