"use client";

import React from "react";
import Box from "../container/Box";
import DateRangePicker from "../DateRangePicker";
import { DateRange } from "@/types";
import Select from "../Select";
import Button from "../Button";
import { Download, RefreshCcw } from "lucide-react";
import { useScreenSize } from "@/hooks/useScreenSIze";
import { cn } from "@/utils/style";

interface IController {
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  logType: string;
  setLogType: React.Dispatch<React.SetStateAction<string>>;
  downloadHandle: () => void;
  isLoading: boolean;
  refreshHandle: () => void;
}

const Controller = ({
  dateRange,
  setDateRange,
  logType,
  setLogType,
  downloadHandle,
  isLoading,
  refreshHandle,
}: IController) => {
  const screenWidth = useScreenSize();
  return (
    <Box containerClassName="flex flex-row gap-4 p-6 items-center z-20">
      <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-2">
        {screenWidth !== "medium" && screenWidth !== "small" && (
          <p className="text-primary text-lg">Filter</p>
        )}
        <Select
          value={logType}
          onChange={(e) => setLogType(e.target.value)}
          className="lg:max-w-24"
        >
          <option value="ALL">All Logs</option>
          <option value="ADMIN.CONFIG">Admin Config</option>
          <option value="ADMIN.DATA">Database Event</option>
          <option value="ADMIN.EXPORT">Data Outbound</option>
          <option value="ADMIN.OPERATION">Admin Action</option>
          <option value="KIOSK">Kiosk</option>
          <option value="SYSTEM.AUTH">Authentication</option>
          <option value="SYSTEM.ATTENDANCE">Cron Job</option>
          <option value="ERROR">System Error</option>
        </Select>
        <DateRangePicker
          fromDate={dateRange.fromDate}
          toDate={dateRange.toDate}
          setFromDate={(e) =>
            setDateRange((prev) => ({ ...prev, fromDate: e }))
          }
          setToDate={(e) => setDateRange((prev) => ({ ...prev, toDate: e }))}
          containerClassName="w-full lg:w-auto"
        />
      </div>
      <Button secondary onClick={() => refreshHandle()} disabled={isLoading}>
        <RefreshCcw
          className={cn("w-5 h-5 text-primary", isLoading && "animate-spin")}
        />
      </Button>
      <Button
        className="flex flex-row gap-0 px-2 py-0 md:gap-2 md:py-2 items-center justify-center"
        onClick={downloadHandle}
        disabled={isLoading}
        secondary
      >
        <Download />
        <p className="invisible w-0 md:visible md:w-auto">
          Download System Log
        </p>
      </Button>
    </Box>
  );
};

export default Controller;
