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

  // Helper to get forecast color class based on probability
  const getForecastColorClass = (probability: number | null) => {
    if (probability === null || probability === undefined) return "";
    if (probability < 0.5) return "text-red-600"; // Low probability = at risk
    if (probability >= 0.7) return "text-green-600"; // High probability = good
    return "text-yellow-600"; // Medium probability
  };

  const getForecastLabel = (probability: number | null) => {
    if (probability === null || probability === undefined)
      return "Analyzing...";
    const percentage = (probability * 100).toFixed(1);
    if (probability < 0.5) return `${percentage}% (At Risk)`;
    if (probability >= 0.7) return `${percentage}% (High Likelihood)`;
    return `${percentage}% (Moderate)`;
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
            title="Average Session"
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
