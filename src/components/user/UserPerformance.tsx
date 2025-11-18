"use client";

import { User } from "@/models";
import { PerformanceMetrics } from "@/types";

import {
  ChartBar,
  ChartScatter,
  TriangleAlert,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  RefreshCcw,
  CheckCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { PerformanceCard } from "./PerformanceCard";
import DropDown from "../container/DropDown";
import { getPerformanceAnalytics } from "@/lib/performance/getPerformanceAnalytics";
import Button from "../Button";
import { cn } from "@/utils/style";

interface IUserPerformance {
  user: User | null;
}

const UserPerformance = ({ user }: IUserPerformance) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get trend icon
  const getTrendIcon = (trend: "improving" | "declining" | "stable") => {
    if (trend === "improving") return TrendingUp;
    if (trend === "declining") return TrendingDown;
    return Activity;
  };

  // Helper to get trend color
  const getTrendColor = (trend: "improving" | "declining" | "stable") => {
    if (trend === "improving") return "green";
    if (trend === "declining") return "red";
    return "blue";
  };

  // Helper to get risk color class
  const getRiskColorClass = (level: string) => {
    switch (level) {
      case "NOT_AT_RISK":
        return "text-green-600";
      case "AT_RISK":
        return "text-red-600";
      default:
        return "";
    }
  };

  const getRiskLabel = (level?: string) => {
    if (!level) return "Analyzing...";
    if (level === "AT_RISK") return "At Risk";
    if (level === "NOT_AT_RISK") return "Not At Risk";
    return level;
  };

  // Helper to get attendance rate color
  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Fetch ML-computed metrics from server action
  const fetchPerformanceMetrics = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { metrics: data, error: fetchError } =
        await getPerformanceAnalytics(user.id);

      if (fetchError) {
        setError(fetchError);
      } else {
        setMetrics(data);
      }
    } catch (err: any) {
      console.error("Error fetching performance metrics:", err);
      setError(err.message || "Failed to load performance analytics");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch metrics on mount
  useEffect(() => {
    if (user) {
      fetchPerformanceMetrics();
    }
  }, [user]);

  // Refresh metrics periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchPerformanceMetrics();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <DropDown
      headerElement={
        <p className="text-lg text-primary/80">Performance Analysis</p>
      }
      isDefaultOpen
    >
      {/** Refresh */}
      <Button
        onClick={fetchPerformanceMetrics}
        secondary
        className="absolute -top-12 right-0"
      >
        <RefreshCcw
          className={cn("w-5 h-5 text-primary/80", isLoading && "animate-spin")}
        />
        Refresh
      </Button>

      {!error ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch mb-4">
          <PerformanceCard
            Icon={ChartScatter}
            title="Average Arrival"
            value={metrics?.averagePunctuality.label ?? "Calculating..."}
            badge={
              metrics
                ? {
                    icon: getTrendIcon(metrics.averagePunctuality.trend),
                    color: getTrendColor(metrics.averagePunctuality.trend),
                  }
                : undefined
            }
            isLoading={isLoading}
          />

          <PerformanceCard
            Icon={ChartBar}
            title="Average Time Balance"
            value={metrics?.averageTimeBalance.label ?? "Calculating..."}
            badge={
              metrics
                ? {
                    icon: getTrendIcon(metrics.averageTimeBalance.trend),
                    color: getTrendColor(metrics.averageTimeBalance.trend),
                  }
                : undefined
            }
            isLoading={isLoading}
          />

          <PerformanceCard
            Icon={CheckCircle}
            title="Attendance Rate"
            value={metrics?.attendanceRate.label ?? "Calculating..."}
            subtitle={
              metrics
                ? `${metrics.attendanceRate.present}/${metrics.attendanceRate.total} sessions`
                : undefined
            }
            valueClassName={
              metrics ? getAttendanceRateColor(metrics.attendanceRate.rate) : ""
            }
            isLoading={isLoading}
          />

          <PerformanceCard
            Icon={TriangleAlert}
            title="Drop-out Risk"
            value={
              metrics
                ? `${metrics.dropoutRisk.percentage}% • ${getRiskLabel(
                    metrics.dropoutRisk.level
                  )}`
                : "Analyzing..."
            }
            subtitle={
              metrics
                ? `${metrics.dropoutRisk.confidence}% confidence`
                : undefined
            }
            valueClassName={
              metrics ? getRiskColorClass(metrics.dropoutRisk.level) : ""
            }
            expandable={
              metrics
                ? {
                    title: "Risk Factors",
                    content: (
                      <ul className="list-disc pl-5 space-y-1 text-xs">
                        {metrics.dropoutRisk.factors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    ),
                  }
                : undefined
            }
            isLoading={isLoading}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-uRed bg-uRed/10 p-4 border border-uRed/20  rounded-lg">
          <AlertCircle size={20} />
          <span>User analytics is currently unavailable</span>
        </div>
      )}
    </DropDown>
  );
};

export default UserPerformance;
