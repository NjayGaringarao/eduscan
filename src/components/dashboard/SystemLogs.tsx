"use client";

import React, { useState, useEffect } from "react";
import Box from "../container/Box";
import Button from "@/components/Button";
import { RefreshCcw, Download } from "lucide-react";
import { cn } from "@/utils/style";
import Select from "../Select";
import DateRangePicker from "../DateRangePicker";
import { SystemLog } from "@/models";
import Loading from "../Loading";
import LogTable from "./LogTable";
import { getLogs, downloadLogs } from "@/lib/log";
import { downloadPdfBlob, sanitizeFilename } from "@/utils/blob";
import TableHolder from "../container/TableHolder";
import { DateRange } from "@/types";

const SystemLogs = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  // Default: All dates (empty strings)
  const [dateRange, setDateRange] = useState<DateRange>({
    fromDate: "",
    toDate: "",
  });
  const [logType, setLogType] = useState("ALL");
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogsHandle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { logs: fetchedLogs, error: fetchError } = await getLogs({
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        logType,
      });

      if (fetchError) {
        setError(fetchError);
        alert(`Failed to fetch logs: ${fetchError}`);
        setLogs([]);
      } else {
        setLogs(fetchedLogs);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadHandle = async () => {
    if (logs.length === 0) {
      alert("No logs to download");
      return;
    }

    setIsDownloading(true);
    try {
      const { buffer, error: downloadError } = await downloadLogs({
        logs,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        logType,
      });

      if (downloadError) {
        alert(`Download failed: ${downloadError}`);
        return;
      }

      if (buffer) {
        // Create filename with sanitized log type
        const sanitizedLogType = sanitizeFilename(logType);
        const dateRangeStr =
          dateRange.fromDate && dateRange.toDate
            ? `${dateRange.fromDate}-to-${dateRange.toDate}`
            : "all-dates";
        const filename = `system-logs-${sanitizedLogType}-${dateRangeStr}.pdf`;

        // Download PDF using utility function
        downloadPdfBlob(buffer, filename, (error) => {
          alert(`Download failed: ${error}`);
        });

        alert("PDF downloaded successfully");
      }
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Fetch logs when component mounts or when filters change
  useEffect(() => {
    fetchLogsHandle();
  }, [dateRange, logType]);

  return (
    <Box containerClassName="flex flex-col gap-6 p-0 overflow-hidden">
      {/* Header / Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-textBody w-full px-6 py-4 gap-4">
        <p className="text-background text-xl font-bold">System Logs</p>

        <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-row lg:gap-4 w-full lg:w-auto">
          <Select
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            disabled={isLoading}
            className="text-base lg:text-lg text-primary bg-secondary w-full lg:w-auto min-w-32"
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
            inputClassName="text-base lg:text-lg bg-secondary"
            containerClassName="col-span-2"
          />

          <Button
            onClick={() => fetchLogsHandle()}
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
            onClick={downloadHandle}
            disabled={isLoading || isDownloading || logs.length === 0}
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

      {/* Error Display */}
      {error && (
        <div className="px-6">
          <div className="flex items-center gap-2 text-uRed bg-uRed/10 p-4 border border-uRed/20 rounded-lg">
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div
        className={cn(
          "relative overflow-hidden overflow-y-auto w-full h-full min-h-20",
          "flex flex-col justify-between gap-4 px-6 pb-6"
        )}
      >
        {!isLoading && !error && (
          <TableHolder className="h-96">
            <LogTable logs={logs} />
          </TableHolder>
        )}

        {isLoading && (
          <div
            className={cn(
              "h-96 w-full rounded-lg py-6",
              "bg-background/10 backdrop-blur-xs",
              "flex flex-col items-center justify-center"
            )}
          >
            <Loading prompt="Loading logs..." />
          </div>
        )}

        {!isLoading && !error && logs.length === 0 && (
          <div className="w-full h-full flex items-center justify-center text-primary/70">
            No logs found.
          </div>
        )}
      </div>
    </Box>
  );
};

export default SystemLogs;
