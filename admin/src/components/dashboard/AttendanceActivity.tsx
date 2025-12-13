"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Box from "../container/Box";
import Button from "@/components/Button";
import { Download, RefreshCcw } from "lucide-react";
import { cn } from "@/utils/style";
import Select from "../Select";
import DatePicker from "../DatePicker";
import { AttendancePoint, UserRole } from "@/lib/dashboard/types";
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
  downloadAttendanceActivity,
} from "@/lib/dashboard";
import { downloadPdfBlob } from "@/utils/blob";

type ViewMode = "FULL_DAY" | "DAYTIME";

const AttendanceActivity = () => {
  const [lineChartData, setLineChartData] = useState<AttendancePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<ViewMode>("DAYTIME");
  const [filter, setFilter] = useState<
    Omit<IAttendanceActivityFilter, "fromDate" | "toDate">
  >({
    role: "ALL",
    interval: "1 hour",
  });

  // Keep interval in sync with view mode (30m for daytime, 1h for full day)
  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      interval: viewMode === "DAYTIME" ? "30 minutes" : "1 hour",
    }));
  }, [viewMode]);

  const chartData = useMemo(() => {
    if (viewMode !== "DAYTIME") return lineChartData;

    return lineChartData.filter((point) => {
      const date = new Date(point.hour);
      if (isNaN(date.getTime())) return false;
      const hour = date.getHours();
      return hour >= 5 && hour < 18;
    });
  }, [lineChartData, viewMode]);

  const fetchDataHandle = useCallback(async () => {
    setIsLoading(true);

    // Convert selectedDate to ISO string with proper timezone handling
    // Using setHours approach like getPerformanceSnapshotByDate
    const dateStart = new Date(selectedDate);
    dateStart.setHours(0, 0, 0, 0);
    const isoDate = dateStart.toISOString();

    // Create filter with same date for both fromDate and toDate
    // The RPC function will automatically expand to full day (00:00:00 to 23:59:59) in Manila timezone
    const apiFilter: IAttendanceActivityFilter = {
      fromDate: isoDate,
      toDate: isoDate,
      role: filter.role,
      interval: filter.interval,
    };

    const { data, error } = await getAttendanceActivity(apiFilter);

    if (error) {
      alert(error);
      setLineChartData([]);
    } else {
      setLineChartData(data);
    }
    setIsLoading(false);
  }, [selectedDate, filter.role, filter.interval]);

  useEffect(() => {
    fetchDataHandle();
  }, [fetchDataHandle]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { buffer, error } = await downloadAttendanceActivity({
        date: selectedDate,
        role: filter.role,
      });

      if (error || !buffer) {
        alert(error ?? "Failed to generate PDF");
        return;
      }

      const filename = `Attendance-Activity-${selectedDate}-${filter.role}.pdf`;
      downloadPdfBlob(buffer, filename, (downloadError) => {
        alert(`Download failed: ${downloadError}`);
      });
    } catch (err: any) {
      console.error("Attendance activity download failed", err);
      alert("An unexpected error occurred while downloading.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Box containerClassName="flex flex-col lg:justify-around items-center gap-6 p-0">
      {/* Header / Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-textBody w-full px-6 py-4 gap-4 rounded-t-xl">
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

          <DatePicker
            date={selectedDate}
            setDate={setSelectedDate}
            disabled={isLoading}
            inputClassName="text-base lg:text-lg bg-secondary"
            containerClassName="w-full lg:w-auto"
          />

          <Select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            disabled={isLoading}
            className="text-base lg:text-lg text-primary bg-secondary w-full lg:w-auto min-w-20"
          >
            <option value="DAYTIME">Daytime</option>
            <option value="FULL_DAY">24 Hours</option>
          </Select>

          <div className="flex gap-2 w-full lg:w-auto">
            <Button
              onClick={fetchDataHandle}
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

            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-secondary w-full lg:w-auto flex justify-center"
            >
              <Download
                className={cn(
                  "w-5 h-5 text-primary",
                  isDownloading && "animate-bounce"
                )}
                strokeWidth={3}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="w-full h-[340px] pb-6">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-primary/70">
            <Loading prompt="Please wait..." />
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-primary/70">
            No data for selected filters
          </div>
        ) : (
          <ResponsiveContainer height="100%">
            <ComposedChart
              data={chartData}
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
                interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
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
    </Box>
  );
};

export default AttendanceActivity;
