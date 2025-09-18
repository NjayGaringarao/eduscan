"use client";

import React, { useState, useEffect } from "react";
import Controller from "./Controller";
import Box from "../container/Box";
import { AttendanceLog, SystemLog } from "@/models";
import Loading from "../Loading";
import { cn } from "@/utils/style";
import LogItem from "./LogItem";
import { getLogs, downloadLogs } from "@/lib/log";
import { downloadPdfBlob, sanitizeFilename } from "@/utils/blob";

const LogContainer = () => {
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
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

    setIsLoading(true);
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
        const filename = `system-logs-${sanitizedLogType}-${dateRange.fromDate}-to-${dateRange.toDate}.pdf`;

        // Download PDF using utility function
        downloadPdfBlob(buffer, filename, (error) => {
          alert(`Download failed: ${error}`);
        });

        alert("PDF downloaded successfully");
      }
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch logs when component mounts or when filters change
  useEffect(() => {
    if (dateRange.fromDate === "" || dateRange.toDate === "") return;
    fetchLogsHandle();
  }, [dateRange, logType]);

  return (
    <>
      <Controller
        dateRange={dateRange}
        setDateRange={setDateRange}
        logType={logType}
        setLogType={setLogType}
        downloadHandle={downloadHandle}
        isLoading={isLoading}
        refreshHandle={fetchLogsHandle}
      />
      <Box>
        {!isLoading && !error && (
          <>
            {logs.length !== 0 ? (
              <>
                {logs.map((log) => (
                  <LogItem key={log.log_id} log={log} />
                ))}
              </>
            ) : (
              <div
                className={cn(
                  "w-full h-56 flex items-center justify-center",
                  "relative w-full rounded-xl p-4",
                  "bg-background/70 backdrop-blur-lg border border-primary/20"
                )}
              >
                <div className="text-center">
                  <p className="text-primary text-2xl mb-2">No logs to show</p>
                  <p className="text-textBody text-sm">
                    Try adjusting your date range or filter criteria
                  </p>
                </div>
              </div>
            )}
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
            <Loading prompt="Loading logs..." />
          </div>
        )}
      </Box>
    </>
  );
};

export default LogContainer;
