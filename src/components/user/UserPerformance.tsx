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
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { PerformanceCard } from "./PerformanceCard";
import DropDown from "../container/DropDown";
import { getPerformanceAnalytics } from "@/lib/performance/getPerformanceAnalytics";

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

  // Helper to get predicted trend color
  const getPredictedTrendColor = (trend: string) => {
    switch (trend) {
      case "STABLE":
        return "text-gray-600";
      case "IMPROVING":
        return "text-green-600";
      case "DECLINING":
        return "text-orange-600";
      case "RANDOM":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  // Helper to get risk color class
  const getRiskColorClass = (level: string) => {
    switch (level) {
      case "LOW":
        return "text-green-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "HIGH":
        return "text-red-600";
      default:
        return "";
    }
  };

  // Fetch ML-computed metrics from server action
  const fetchPerformanceMetrics = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { metrics: data, error: fetchError } =
        await getPerformanceAnalytics(user.user_id);

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

  if (error) {
    return (
      <DropDown
        headerElement={
          <p className="text-lg text-primary/80">Performance Analysis</p>
        }
      >
        <div className="flex items-center gap-2 text-red-500 p-4 bg-red-50 rounded-lg">
          <AlertCircle size={20} />
          <span>Error loading performance metrics: {error}</span>
        </div>
      </DropDown>
    );
  }

  return (
    <DropDown
      headerElement={
        <div className="flex items-center justify-between w-full">
          <p className="text-lg text-primary/80">Performance Analysis</p>
          {metrics && (
            <span className="text-xs text-muted-foreground">
              Updated: {new Date(metrics.lastUpdated).toLocaleTimeString()} |{" "}
              {metrics.dataPoints} sessions analyzed
            </span>
          )}
        </div>
      }
    >
      {/* PERFORMANCE METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch mb-4">
        <PerformanceCard
          Icon={ChartScatter}
          title="Average Arrival"
          value={metrics?.averageArrivalOffset.label ?? "Calculating..."}
          badge={
            metrics
              ? {
                  icon: getTrendIcon(metrics.averageArrivalOffset.trend),
                  color: getTrendColor(metrics.averageArrivalOffset.trend),
                }
              : undefined
          }
          isLoading={isLoading}
        />

        <PerformanceCard
          Icon={ChartBar}
          title="Average Undertime"
          value={metrics?.averageUndertime.label ?? "Calculating..."}
          badge={
            metrics
              ? {
                  icon: getTrendIcon(metrics.averageUndertime.trend),
                  color: getTrendColor(metrics.averageUndertime.trend),
                }
              : undefined
          }
          isLoading={isLoading}
        />

        <PerformanceCard
          Icon={TriangleAlert}
          title="Drop-out Risk"
          value={
            metrics
              ? `${metrics.dropoutRisk.percentage}% [${metrics.dropoutRisk.level}]`
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

        <PerformanceCard
          Icon={TrendingUp}
          title="Performance Trend"
          value={metrics?.predictedTrend.trend ?? "Analyzing..."}
          subtitle={
            metrics
              ? `${metrics.predictedTrend.confidence}% confidence`
              : undefined
          }
          valueClassName={
            metrics ? getPredictedTrendColor(metrics.predictedTrend.trend) : ""
          }
          expandable={
            metrics
              ? {
                  title: "Trend Description",
                  content: (
                    <p className="text-xs text-muted-foreground">
                      {metrics.predictedTrend.description}
                    </p>
                  ),
                }
              : undefined
          }
          isLoading={isLoading}
        />
      </div>
    </DropDown>
  );
};

export default UserPerformance;
