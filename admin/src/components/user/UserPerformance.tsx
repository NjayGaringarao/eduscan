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

  const getForecastStatus = (
    probability: number | null
  ): "at-risk of absent" | "either absent or present" | "probably present" | null => {
    if (probability === null || probability === undefined) return null;
    if (probability < 0.4) return "at-risk of absent";
    if (probability > 0.6) return "probably present";
    return "either absent or present";
  };

  // Formatting helpers
  const formatPunctuality = (value: number | null): string => {
    if (value === null || value === undefined) return "No Data";
    const absValue = Math.abs(value);
    if (value < -15) return `${Math.round(absValue)} Minutes Late`;
    if (value > 15) return `${Math.round(absValue)} Minutes Early`;
    return "On Time";
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
      | "at-risk of absent"
      | "either absent or present"
      | "probably present"
      | null
  ) => {
    if (
      status === "late" ||
      status === "at_risk" ||
      status === "undertime" ||
      status === "at-risk of absent"
    )
      return TrendingDown;
    if (
      status === "early" ||
      status === "stable" ||
      status === "overtime" ||
      status === "probably present"
    )
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
      | "at-risk of absent"
      | "either absent or present"
      | "probably present"
      | null
  ): "green" | "red" | "blue" => {
    if (
      status === "late" ||
      status === "at_risk" ||
      status === "undertime" ||
      status === "at-risk of absent"
    )
      return "red";
    if (
      status === "early" ||
      status === "stable" ||
      status === "overtime" ||
      status === "probably present"
    )
      return "green";
    return "blue";
  };

  // Helper to get forecast color class based on probability
  const getForecastColorClass = (probability: number | null) => {
    if (probability === null || probability === undefined) return "";
    const status = getForecastStatus(probability);
    if (status === "at-risk of absent") return "text-red-600";
    if (status === "probably present") return "text-green-600";
    return "text-yellow-600";
  };

  const getForecastLabel = (probability: number | null) => {
    if (probability === null || probability === undefined)
      return "Analyzing...";
    const percentage = (probability * 100).toFixed(1);
    const status = getForecastStatus(probability);
    if (status === "at-risk of absent")
      return `${percentage}% (At-risk of absent)`;
    if (status === "probably present")
      return `${percentage}% (Probably present)`;
    return `${percentage}% (Either absent or present)`;
  };

  // Helper to get attendance rate color
  const getAttendanceRateColor = (rate: number | null) => {
    if (rate === null || rate === undefined) return "";
    const status = getAttendanceRateStatus(rate);
    if (status === "at_risk") return "text-red-600";
    if (status === "stable") return "text-green-600";
    return "text-yellow-600";
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
        <p className="text-lg text-primary/80">
          Performance Analysis (Past 10 Records)
        </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch mb-4">
          <PerformanceCard
            Icon={ChartScatter}
            title="Average Punctuality"
            value={
              metrics?.averagePunctuality.value !== null &&
              metrics?.averagePunctuality.value !== undefined
                ? formatPunctuality(metrics.averagePunctuality.value)
                : "Calculating..."
            }
            badge={
              metrics &&
              metrics.averagePunctuality.value !== null &&
              metrics.averagePunctuality.value !== undefined
                ? {
                    icon: getStatusIcon(
                      getPunctualityStatus(metrics.averagePunctuality.value)
                    ),
                    color: getStatusColor(
                      getPunctualityStatus(metrics.averagePunctuality.value)
                    ),
                  }
                : undefined
            }
            isLoading={isLoading}
          />

          <PerformanceCard
            Icon={ChartBar}
            title="Average Session"
            value={
              metrics?.averageTimeBalance.value !== null &&
              metrics?.averageTimeBalance.value !== undefined
                ? formatTimeBalance(metrics.averageTimeBalance.value)
                : "Calculating..."
            }
            badge={
              metrics &&
              metrics.averageTimeBalance.value !== null &&
              metrics.averageTimeBalance.value !== undefined
                ? {
                    icon: getStatusIcon(
                      getTimeBalanceStatus(metrics.averageTimeBalance.value)
                    ),
                    color: getStatusColor(
                      getTimeBalanceStatus(metrics.averageTimeBalance.value)
                    ),
                  }
                : undefined
            }
            isLoading={isLoading}
          />

          <PerformanceCard
            Icon={CheckCircle}
            title="Attendance Rate"
            value={
              metrics?.attendanceRate.rate !== null &&
              metrics?.attendanceRate.rate !== undefined
                ? formatAttendanceRate(metrics.attendanceRate.rate)
                : "Calculating..."
            }
            subtitle={
              metrics &&
              metrics.attendanceRate.present !== null &&
              metrics.attendanceRate.total !== null
                ? `${metrics.attendanceRate.present}/${metrics.attendanceRate.total} sessions`
                : undefined
            }
            valueClassName={
              metrics?.attendanceRate.rate !== null &&
              metrics?.attendanceRate.rate !== undefined
                ? getAttendanceRateColor(metrics.attendanceRate.rate)
                : ""
            }
            badge={
              metrics &&
              metrics.attendanceRate.rate !== null &&
              metrics.attendanceRate.rate !== undefined
                ? {
                    icon: getStatusIcon(
                      getAttendanceRateStatus(metrics.attendanceRate.rate)
                    ),
                    color: getStatusColor(
                      getAttendanceRateStatus(metrics.attendanceRate.rate)
                    ),
                  }
                : undefined
            }
            isLoading={isLoading}
          />

          <PerformanceCard
            Icon={TriangleAlert}
            title="Attendance Forecast"
            value={
              metrics
                ? getForecastLabel(metrics.attendanceForecast.probability)
                : "Analyzing..."
            }
            subtitle={
              metrics && metrics.attendanceForecast.confidence !== null
                ? `${metrics.attendanceForecast.confidence}% confidence`
                : undefined
            }
            valueClassName={
              metrics && metrics.attendanceForecast.probability !== null
                ? getForecastColorClass(metrics?.attendanceForecast.probability)
                : ""
            }
            expandable={
              metrics
                ? {
                    title: "Forecast Factors",
                    content: (
                      <ul className="list-disc pl-5 space-y-1 text-xs">
                        {metrics?.attendanceForecast.factors.map(
                          (factor, idx) => (
                            <li key={idx}>{factor}</li>
                          )
                        )}
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
