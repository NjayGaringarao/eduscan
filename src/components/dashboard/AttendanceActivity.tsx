"use client";

import React, { useEffect, useState } from "react";
import Box from "../container/Box";
import Button from "@/components/Button";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/utils/style";
import Select from "../Select";
import DatePicker from "../DatePicker";
import {
  AttendanceChartInterval,
  AttendancePeriod,
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
    date: new Date().toISOString(),
    period: "04:00-19:00",
    role: "ALL",
    interval: "1 hour",
  });

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
        <p className="text-background text-xl font-bold">
          Daily Attendance Activity
        </p>

        <div className="grid grid-cols-3 gap-3 lg:flex lg:flex-row  lg:gap-4 w-full lg:w-auto">
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

          <DatePicker
            value={filter.date ?? new Date().toDateString()}
            setValue={(e) => setFilter((prev) => ({ ...prev, date: e }))}
            disabled={isLoading}
            inputClassName="w-full lg:w-42 bg-secondary hover:bg-secondary hover:brightness-110"
            containerClassName="text-base lg:text-lg col-span-2"
          />

          <Select
            value={filter.period}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                period: e.target.value as AttendancePeriod,
              }))
            }
            disabled={isLoading}
            className="text-base lg:text-lg text-primary bg-secondary w-full lg:w-auto min-w-32"
          >
            <option value="04:00-19:00">4AM - 7PM</option>
            <option value="00:00-23:59">24 Hours</option>
          </Select>

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
            <option value="1 hour">1h</option>
            <option value="30 minutes">30m</option>
            <option value="15 minutes">15m</option>
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
                  tick={{ fill: "#9CA3AF" }}
                  stroke="#374151"
                  interval={Math.max(
                    0,
                    Math.floor(lineChartData.length / 8) - 1
                  )}
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
