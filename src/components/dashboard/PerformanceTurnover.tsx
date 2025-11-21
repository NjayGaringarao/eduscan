"use client";

import React, { useCallback, useEffect, useState } from "react";
import Box from "../container/Box";
import Button from "@/components/Button";
import {
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
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
  AtRiskUser,
} from "@/lib/performance";
import { PerformanceTurnoverSnapshot } from "@/types";
import Table from "../table/Table";
import { ColumnDef } from "@tanstack/react-table";
import { TD_BASE, TD_ID } from "../table/tableUtils";

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
  const [error, setError] = useState<string | null>(null);

  // Helper to get trend icon
  const getTrendIcon = (
    trend?: "improving" | "declining" | "stable" | null
  ) => {
    if (trend === "improving") return TrendingUp;
    if (trend === "declining") return TrendingDown;
    return Activity;
  };

  // Helper to get trend color
  const getTrendColor = (
    trend?: "improving" | "declining" | "stable" | null
  ) => {
    if (trend === "improving") return "green";
    if (trend === "declining") return "red";
    return "blue";
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

  // Table columns for at-risk users
  const atRiskColumns: ColumnDef<AtRiskUser, any>[] = [
    {
      accessorKey: "id",
      header: "User ID",
      cell: (props) => <p className={TD_ID}>{props.getValue()}</p>,
    },
    {
      id: "full_name",
      header: "Full Name",
      cell: ({ row }) => {
        const user = row.original;
        const fullName = `${user.first_name || ""} ${user.middle_name || ""} ${
          user.last_name || ""
        }`.trim();
        return <p className={cn(TD_BASE, "truncate")}>{fullName || "N/A"}</p>;
      },
    },
    {
      accessorKey: "dropout_risk_percentage",
      header: "Risk %",
      cell: (props) => (
        <p className={cn(TD_BASE, "truncate")}>
          {formatPercentage(props.getValue())}
        </p>
      ),
    },
    {
      accessorKey: "dropout_risk_confidence",
      header: "Confidence",
      cell: (props) => (
        <p className={cn(TD_BASE, "truncate")}>
          {formatPercentage(props.getValue())}
        </p>
      ),
    },
    {
      accessorKey: "dropout_risk_level",
      header: "Risk Level",
      cell: (props) => (
        <p className={cn(TD_BASE, "truncate", "text-uRed")}>
          {props.getValue()}
        </p>
      ),
    },
    {
      accessorKey: "attendance_rate_value",
      header: "Attendance Rate",
      cell: (props) => (
        <p className={cn(TD_BASE, "truncate")}>
          {formatPercentage(props.getValue())}
        </p>
      ),
    },
  ];

  return (
    <Box containerClassName="flex flex-col gap-6 p-0 overflow-hidden">
      {/* Global Controller - Row 1, Columns 1-4 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-textBody w-full px-6 py-4 gap-4">
        <div className="flex items-center gap-2">
          <p className="text-background text-xl font-bold">
            Performance Turnover
          </p>
          {snapshot && (
            <span className="text-background/70 text-sm">
              (
              {new Date(snapshot.snapshot_date).toLocaleDateString("en-US", {
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
        <div className="grid grid-cols-4 gap-6 px-6 pb-6">
          {/* At-Risk Users Table - Columns 1-2, Rows 2-3 (spans 2 rows) */}
          <div className="col-span-2 row-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-uRed" />
              <p className="text-primary text-lg font-semibold">
                At-Risk Users
              </p>
              <span className="text-textBody text-sm">
                ({atRiskUsers.length})
              </span>
            </div>
            <div className="flex-1 overflow-hidden min-h-[400px]">
              {atRiskUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[400px] text-primary/70 border border-primary/20 rounded-lg">
                  <p>No at-risk users</p>
                </div>
              ) : (
                <Table
                  data={atRiskUsers}
                  columns={atRiskColumns}
                  query=""
                  height="100%"
                  containerClassName="h-full min-h-[400px]"
                  enableRowSelection={false}
                  enableColumnReordering={false}
                  emptyMessage="No at-risk users found"
                />
              )}
            </div>
          </div>

          {/* Average Punctuality - Column 3, Row 2 */}
          <div className="col-span-1">
            <PerformanceCard
              Icon={Clock}
              title="Average Punctuality"
              value={snapshot?.average_punctuality_label || "No Data"}
              badge={
                snapshot?.average_punctuality_trend
                  ? {
                      icon: getTrendIcon(snapshot.average_punctuality_trend),
                      color: getTrendColor(
                        snapshot.average_punctuality_trend
                      ) as "green" | "red" | "blue",
                    }
                  : undefined
              }
              isLoading={isLoading}
            />
          </div>

          {/* Average Time Balance - Column 4, Row 2 */}
          <div className="col-span-1">
            <PerformanceCard
              Icon={Activity}
              title="Average Time Balance"
              value={snapshot?.average_time_balance_label || "No Data"}
              badge={
                snapshot?.average_time_balance_trend
                  ? {
                      icon: getTrendIcon(snapshot.average_time_balance_trend),
                      color: getTrendColor(
                        snapshot.average_time_balance_trend
                      ) as "green" | "red" | "blue",
                    }
                  : undefined
              }
              isLoading={isLoading}
            />
          </div>

          {/* Percentage At-Risk Users - Columns 3-4, Row 3 (spans 2 columns) */}
          <div className="col-span-2">
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
    </Box>
  );
};

export default PerformanceTurnover;
