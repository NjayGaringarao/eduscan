"use client";

import React, { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import {
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  Download,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/utils/style";
import Select from "../Select";
import DatePicker from "../DatePicker";
import Loading from "../Loading";
import { PerformanceCard } from "../user/PerformanceCard";
import {
  getPerformanceSnapshotByDate,
  getAtRiskUsers,
  triggerSnapshotComputation,
  downloadPerformanceTurnover,
  AtRiskUser,
} from "@/lib/performance";
import { PerformanceTurnoverSnapshot } from "@/types";
import TableHolder from "../container/TableHolder";
import AtRiskUsersTable from "./AtRiskUsersTable";
import { downloadPdfBlob } from "@/utils/blob";

const PerformanceTurnover = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedUserType, setSelectedUserType] = useState<
    "ALL" | "STUDENT" | "EMPLOYEE"
  >("ALL");
  const [snapshot, setSnapshot] = useState<PerformanceTurnoverSnapshot | null>(
    null
  );
  const [atRiskUsers, setAtRiskUsers] = useState<AtRiskUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interpretation helpers
  const getPunctualityStatus = (
    value: number | null
  ): "late" | "normal" | "early" | null => {
    if (value === null || value === undefined) return null;
    if (value < -15) return "late";
    if (value > 15) return "early";
    return "normal";
  };

  const getAttendanceRateStatus = (
    value: number | null
  ): "at_risk" | "normal" | "stable" | null => {
    if (value === null || value === undefined) return null;
    if (value < 70) return "at_risk";
    if (value > 90) return "stable";
    return "normal";
  };

  const getTimeBalanceStatus = (
    value: number | null
  ): "undertime" | "overtime" | "balanced" | null => {
    if (value === null || value === undefined) return null;
    if (value < 0) return "undertime";
    if (value > 0) return "overtime";
    return "balanced";
  };

  // Formatting helpers
  const formatPunctuality = (value: number | null): string => {
    if (value === null || value === undefined) return "No Data";
    const absValue = Math.abs(value);
    if (value < -15) return `${Math.round(absValue)} Minutes Late`;
    if (value > 15) return `${Math.round(absValue)} Minutes Early`;
    // For values between -15 and 15, show the value with 1 decimal if < 1, otherwise rounded
    const displayValue =
      Math.abs(value) < 1 ? value.toFixed(1) : Math.round(value);
    return `${displayValue}m (On-Time)`;
  };

  const formatTimeBalance = (value: number | null): string => {
    if (value === null || value === undefined) return "No Data";
    const absValue = Math.abs(value);
    const hours = Math.floor(absValue / 60);
    const minutes = Math.round(absValue % 60);
    if (value < 0) {
      return hours > 0
        ? `${hours}h ${minutes}m Undertime`
        : `${minutes}m Undertime`;
    }
    if (value > 0) {
      return hours > 0
        ? `${hours}h ${minutes}m Overtime`
        : `${minutes}m Overtime`;
    }
    return "Balanced";
  };

  const formatAttendanceRate = (value: number | null): string => {
    if (value === null || value === undefined) return "No Data";
    return `${value.toFixed(1)}%`;
  };

  // Helper to get status icon
  const getStatusIcon = (
    status:
      | "late"
      | "normal"
      | "early"
      | "at_risk"
      | "stable"
      | "undertime"
      | "overtime"
      | "balanced"
      | null
  ) => {
    if (status === "late" || status === "at_risk" || status === "undertime")
      return TrendingDown;
    if (status === "early" || status === "stable" || status === "overtime")
      return TrendingUp;
    return Activity;
  };

  // Helper to get status color
  const getStatusColor = (
    status:
      | "late"
      | "normal"
      | "early"
      | "at_risk"
      | "stable"
      | "undertime"
      | "overtime"
      | "balanced"
      | null
  ): "green" | "red" | "blue" => {
    if (status === "late" || status === "at_risk" || status === "undertime")
      return "red";
    if (status === "early" || status === "stable" || status === "overtime")
      return "green";
    return "blue";
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { buffer, error: downloadError } =
        await downloadPerformanceTurnover({
          date: selectedDate,
          role: selectedUserType,
        });

      if (downloadError || !buffer) {
        alert(downloadError ?? "Failed to generate PDF");
        return;
      }

      const filename = `Performance-Turnover-${selectedDate}-${selectedUserType}.pdf`;
      downloadPdfBlob(buffer, filename, (err) => {
        alert(`Download failed: ${err}`);
      });
    } catch (err: any) {
      console.error("Performance turnover download failed", err);
      alert("An unexpected error occurred while downloading.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper to format percentage
  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return `${value.toFixed(1)}%`;
  };

  // Fetch snapshot and at-risk users
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch snapshot for selected date and user type
      const { data: snapshotData, error: snapshotError } =
        await getPerformanceSnapshotByDate(selectedDate, selectedUserType);

      if (snapshotError) {
        setError(snapshotError);
        setSnapshot(null);
      } else {
        setSnapshot(snapshotData);
      }

      // Fetch at-risk users
      const { data: usersData, error: usersError } = await getAtRiskUsers(
        selectedDate,
        selectedUserType
      );

      if (usersError) {
        console.error("Error fetching at-risk users:", usersError);
        setAtRiskUsers([]);
      } else {
        setAtRiskUsers(usersData || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedUserType]);

  // Handle refresh button
  const handleRefresh = async () => {
    const today = new Date().toISOString().split("T")[0];

    // Only trigger computation if selected date is today
    if (selectedDate === today) {
      setIsRefreshing(true);
      try {
        const { success, error: refreshError } =
          await triggerSnapshotComputation(selectedDate);

        if (refreshError) {
          console.error("Error triggering snapshot computation:", refreshError);
          alert(`Failed to trigger snapshot computation: ${refreshError}`);
        } else if (success) {
          // Wait a bit for computation to complete, then refresh data
          setTimeout(() => {
            fetchData();
          }, 2000);
        }
      } catch (err: any) {
        console.error("Failed to trigger snapshot computation:", err);
        alert(`Failed to trigger snapshot computation: ${err.message}`);
      } finally {
        setIsRefreshing(false);
      }
    } else {
      // Just refresh data if not today
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-6 p-0 overflow-hidden bg-transparent border-none">
      {/* Global Controller - Row 1, Columns 1-4 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-textBody w-full px-6 py-4 gap-4 rounded-xl">
        <div className="flex items-center gap-2">
          <p className="text-background text-xl font-bold">
            Performance Turnover
          </p>
          {snapshot && (
            <span className="text-background/70 text-sm">
              (
              {new Date(snapshot.created_at).toLocaleDateString("en-US", {
                dateStyle: "medium",
              })}
              )
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Select
            value={selectedUserType}
            onChange={(e) =>
              setSelectedUserType(
                e.target.value as "ALL" | "STUDENT" | "EMPLOYEE"
              )
            }
            disabled={isLoading || isRefreshing}
            className="text-base lg:text-lg text-primary bg-secondary w-full sm:w-auto min-w-32"
          >
            <option value="ALL">All Users</option>
            <option value="STUDENT">Students</option>
            <option value="EMPLOYEE">Employees</option>
          </Select>

          <DatePicker
            date={selectedDate}
            setDate={setSelectedDate}
            disabled={isLoading || isRefreshing}
            inputClassName="text-base lg:text-lg bg-secondary"
            containerClassName="w-full sm:w-auto"
          />

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
            <Button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="bg-secondary w-full sm:w-auto flex justify-center"
            >
              <RefreshCcw
                className={cn(
                  "w-5 h-5 text-primary",
                  (isLoading || isRefreshing) && "animate-spin"
                )}
                strokeWidth={3}
              />
            </Button>

            <Button
              onClick={handleDownload}
              disabled={isDownloading || isLoading || !snapshot}
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

      {/* Error Display */}
      {error && (
        <div className="px-6">
          <div className="flex items-center gap-2 text-uRed bg-uRed/10 p-4 border border-uRed/20 rounded-lg">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Grid - Rows 2-3, Columns 1-4 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96 px-6">
          <Loading prompt="Loading performance data..." />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* At-Risk Users Table - Columns 1-2, Rows 2-3 (spans 2 rows) */}
          <div className="col-span-2 row-span-2 flex flex-col gap-4 h-full max-h-full bg-background/70 rounded-xl">
            <div className="flex-1 overflow-hidden h-full max-h-full">
              {atRiskUsers.length === 0 ? (
                <div className="flex items-center justify-center h-72 lg:h-full text-primary/70 border border-primary/20 rounded-lg">
                  <p>No at-risk users</p>
                </div>
              ) : (
                <TableHolder className="h-72 lg:h-full">
                  <AtRiskUsersTable users={atRiskUsers} height="100%" />
                </TableHolder>
              )}
            </div>
          </div>

          {/* Average Attendance Rate - Column 3, Row 1 */}
          <div className="col-span-1">
            <PerformanceCard
              Icon={CheckCircle}
              title="Average Attendance Rate"
              value={formatAttendanceRate(snapshot?.attendance_rate ?? null)}
              badge={
                snapshot?.attendance_rate !== null &&
                snapshot?.attendance_rate !== undefined
                  ? {
                      icon: getStatusIcon(
                        getAttendanceRateStatus(snapshot.attendance_rate)
                      ),
                      color: getStatusColor(
                        getAttendanceRateStatus(snapshot.attendance_rate)
                      ),
                    }
                  : undefined
              }
              isLoading={isLoading}
            />
          </div>

          {/* Average Punctuality - Column 3, Row 2 */}
          <div className="col-span-1">
            <PerformanceCard
              Icon={Clock}
              title="Average Punctuality"
              value={formatPunctuality(snapshot?.average_punctuality ?? null)}
              badge={
                snapshot?.average_punctuality !== null &&
                snapshot?.average_punctuality !== undefined
                  ? {
                      icon: getStatusIcon(
                        getPunctualityStatus(snapshot.average_punctuality)
                      ),
                      color: getStatusColor(
                        getPunctualityStatus(snapshot.average_punctuality)
                      ),
                    }
                  : undefined
              }
              isLoading={isLoading}
            />
          </div>

          {/* Average Time Balance - Column 4, Row 3 */}
          <div className="col-span-1">
            <PerformanceCard
              Icon={Activity}
              title="Average Time Balance"
              value={formatTimeBalance(snapshot?.average_time_balance ?? null)}
              badge={
                snapshot?.average_time_balance !== null &&
                snapshot?.average_time_balance !== undefined
                  ? {
                      icon: getStatusIcon(
                        getTimeBalanceStatus(snapshot.average_time_balance)
                      ),
                      color: getStatusColor(
                        getTimeBalanceStatus(snapshot.average_time_balance)
                      ),
                    }
                  : undefined
              }
              isLoading={isLoading}
            />
          </div>

          {/* Percentage At-Risk Users - Column 4, Row 4 */}
          <div className="col-span-1">
            <PerformanceCard
              Icon={AlertTriangle}
              title="Percentage At-Risk"
              value={
                snapshot && snapshot.total_users > 0
                  ? formatPercentage(
                      (snapshot.at_risk_count / snapshot.total_users) * 100
                    )
                  : "No Data"
              }
              subtitle={
                snapshot && snapshot.total_users > 0
                  ? `${snapshot.at_risk_count}/${snapshot.total_users} users`
                  : undefined
              }
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceTurnover;
