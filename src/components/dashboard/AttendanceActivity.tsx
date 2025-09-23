"use client";

import React, { useEffect, useMemo, useState } from "react";
import Box from "../container/Box";
import Button from "@/components/Button";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/utils/style";
import Select from "../Select";
import DateRangePicker from "../DateRangePicker";
import {
  AttendanceChartInterval,
  AttendancePoint,
  UserRole,
} from "@/lib/dashboard/types";
import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Bar,
  Area,
  ComposedChart,
} from "recharts";
import Loading from "../Loading";
import {
  getAttendanceActivity,
  IAttendanceActivityFilter,
} from "@/lib/dashboard";

const AttendanceActivity = () => {
  const [lineChartData, setLineChartData] = useState<AttendancePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<IAttendanceActivityFilter>({
    fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    toDate: new Date().toISOString(),
    role: "ALL",
    interval: "1 hour",
  });

  // Dynamic intervals based on range length
  const allowedIntervals = useMemo<AttendanceChartInterval[]>(() => {
    const start = new Date(filter.fromDate).getTime();
    const end = new Date(filter.toDate).getTime();
    const ms = Math.max(0, end - start);
    const hours = ms / (1000 * 60 * 60);

    if (hours <= 2)
      return [
        "5 minutes",
        "10 minutes",
        "15 minutes",
        "30 minutes",
        "45 minutes",
        "1 hour",
      ];
    if (hours <= 6)
      return ["10 minutes", "15 minutes", "30 minutes", "45 minutes", "1 hour"];
    if (hours <= 12)
      return ["15 minutes", "30 minutes", "45 minutes", "1 hour", "2 hours"];
    if (hours <= 24)
      return ["30 minutes", "45 minutes", "1 hour", "2 hours", "4 hours"];
    if (hours <= 72)
      return ["1 hour", "2 hours", "4 hours", "6 hours", "8 hours"];
    return ["2 hours", "4 hours", "6 hours", "8 hours"];
  }, [filter.fromDate, filter.toDate]);

  // Ensure current interval is always valid for current range
  useEffect(() => {
    if (!allowedIntervals.includes(filter.interval)) {
      setFilter((prev) => ({
        ...prev,
        interval: allowedIntervals[allowedIntervals.length - 1],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedIntervals]);

  const fetchDataHandle = async (_filter: IAttendanceActivityFilter) => {
    setIsLoading(true);
    const { data, error } = await getAttendanceActivity(_filter);

    if (error) {
      alert(error);
      setLineChartData([]);
    } else {
      setLineChartData(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDataHandle(filter);
  }, [filter]);

  return (
    <Box containerClassName="flex flex-col gap-6 p-0 overflow-hidden">
      {/* Header / Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-textBody w-full px-6 py-4 gap-4">
        <p className="text-background text-xl font-bold">Attendance Logging</p>

        <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-row  lg:gap-4 w-full lg:w-auto">
          <Select
            value={filter.role}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                role: e.target.value as UserRole,
              }))
            }
            disabled={isLoading}
            className="text-base lg:text-lg text-primary bg-secondary w-full lg:w-auto min-w-32"
          >
            <option value="ALL">All User</option>
            <option value="STUDENT">Student</option>
            <option value="EMPLOYEE">Employee</option>
          </Select>

          <DateRangePicker
            fromDate={filter.fromDate}
            toDate={filter.toDate}
            setFromDate={(e) => setFilter((prev) => ({ ...prev, fromDate: e }))}
            setToDate={(e) => setFilter((prev) => ({ ...prev, toDate: e }))}
            inputClassName="text-base lg:text-lg bg-secondary"
            containerClassName="col-span-2"
            maxDays={5}
          />

          {/* Period selector removed for range mode */}

          <Select
            value={filter.interval}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                interval: e.target.value as AttendanceChartInterval,
              }))
            }
            disabled={isLoading}
            className="text-base lg:text-lg text-primary bg-secondary w-full lg:w-auto min-w-20"
          >
            {allowedIntervals.map((opt) => (
              <option key={opt} value={opt}>
                {opt
                  .replace(" minutes", "m")
                  .replace(" hours", "h")
                  .replace(" hour", "h")}
              </option>
            ))}
          </Select>

          <Button
            onClick={() => fetchDataHandle(filter)}
            disabled={isLoading}
            className="bg-secondary w-full lg:w-auto flex justify-center"
          >
            <RefreshCcw
              className={cn(
                "w-5 h-5 text-primary",
                isLoading && "animate-spin"
              )}
              strokeWidth={3}
            />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col xl:flex-row lg:justify-around items-center gap-6",
          "flex-1 p-6"
        )}
      >
        {/* Chart container */}
        <div className="w-full h-[340px]">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-primary/70">
              <Loading prompt="Please wait..." />
            </div>
          ) : lineChartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-primary/70">
              No data for selected filters
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={lineChartData}
                margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-textBody)"
                  opacity={1}
                />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#9CA3AF", textAnchor: "end" }}
                  fontSize={8}
                  interval={Math.max(
                    0,
                    Math.floor(lineChartData.length / 8) - 1
                  )}
                  tickFormatter={(value) => {
                    // Optional: shorten long labels
                    // Format the date string to "M/D HH:mm"
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                      const month = date.getMonth() + 1;
                      const day = date.getDate();
                      const hours = date.getHours().toString().padStart(2, "0");
                      const minutes = date
                        .getMinutes()
                        .toString()
                        .padStart(2, "0");
                      return `${month}/${day} ${hours}:${minutes}`;
                    }
                    return value;
                  }}
                  height={60}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#9CA3AF" }}
                  stroke="#374151"
                />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#D1D5DB" }}
                  itemStyle={{ color: "#E5E7EB" }}
                />
                <Legend wrapperStyle={{ color: "#D1D5DB" }} />
                <Area
                  type="monotone"
                  dataKey="occupancy"
                  name="Occupancy"
                  fill="var(--color-textBody)"
                  stroke="var(--color-textBody)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Bar
                  type="monotone"
                  dataKey="timein"
                  name="Time In"
                  fill="var(--color-uGreen)"
                />
                <Bar
                  type="monotone"
                  dataKey="timeout"
                  name="Time Out"
                  fill="var(--color-uRed)"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Box>
  );
};

export default AttendanceActivity;
