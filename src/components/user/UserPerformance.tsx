"use client";

import { User } from "@/models";
import { PerformanceMetrics } from "@/types";

import {
  ChartBar,
  ChartScatter,
  MapPinPlusInside,
  MapPinX,
  Timer,
  TimerOff,
  TriangleAlert,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Activity,
  AlertCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import * as sessionDB from "@/database/activeSession";
import { getElapsedTime } from "@/utils/time";
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
  const [currentSession, setCurrentSession] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<string>("");

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
      case "LOW":
        return "text-green-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "HIGH":
        return "text-orange-600";
      case "CRITICAL":
        return "text-red-600";
      default:
        return "";
    }
  };

  // Fetch current session status
  const fetchSessionStatus = async () => {
    if (!user) return;
    const { session } = await sessionDB.get(user.user_id);
    setCurrentSession(!!session);
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

  // Fetch session status and metrics on mount
  useEffect(() => {
    if (user) {
      fetchSessionStatus();
      fetchPerformanceMetrics();
    }
  }, [user]);

  // Timer effect for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession) {
      interval = setInterval(() => {
        setElapsed(getElapsedTime(new Date(), new Date()));
      }, 1000);
    } else {
      setElapsed("");
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  // Refresh metrics periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchPerformanceMetrics();
        fetchSessionStatus();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const statusIcon = user?.student ? MapPinPlusInside : Timer;
  const statusIconInactive = user?.student ? MapPinX : TimerOff;
  const statusText = user?.student
    ? ["INSIDE THE CAMPUS", "OUTSIDE THE CAMPUS"]
    : ["TIMED IN", "TIMED OUT"];

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
          <p className="text-lg text-primary/80">
            Performance Turnover Analysis
          </p>
          {metrics && (
            <span className="text-xs text-muted-foreground">
              Updated: {new Date(metrics.lastUpdated).toLocaleTimeString()} |{" "}
              {metrics.dataPoints} sessions analyzed
            </span>
          )}
        </div>
      }
    >
      {/* PRIMARY METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch mb-4">
        <PerformanceCard
          Icon={currentSession ? statusIcon : statusIconInactive}
          title="Current Status"
          value={currentSession ? statusText[0] : statusText[1]}
          subtitle={elapsed || undefined}
          isLoading={isLoading}
        />

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
      </div>

      {/* SECONDARY METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch mb-4">
        <PerformanceCard
          Icon={Clock}
          title="Punctuality Score"
          value={
            metrics ? `${metrics.punctualityScore.value}/100` : "Calculating..."
          }
          subtitle={
            metrics
              ? `${metrics.punctualityScore.onTimeRate}% on-time`
              : undefined
          }
          isLoading={isLoading}
        />

        <PerformanceCard
          Icon={TriangleAlert}
          title="Drop-out Risk"
          value={
            metrics
              ? `${metrics.riskScore.percentage}% [${metrics.riskScore.level}]`
              : "Analyzing..."
          }
          subtitle={
            metrics ? `${metrics.riskScore.confidence}% confidence` : undefined
          }
          valueClassName={
            metrics ? getRiskColorClass(metrics.riskScore.level) : ""
          }
          expandable={
            metrics
              ? {
                  title: "Risk Factors",
                  content: (
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      {metrics.riskScore.factors.map((factor, idx) => (
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
          Icon={Target}
          title="Next Week Forecast"
          value={
            metrics
              ? `${metrics.nextWeekPrediction.attendanceRate}% expected`
              : "Predicting..."
          }
          subtitle={
            metrics
              ? `${metrics.nextWeekPrediction.confidence}% confidence`
              : undefined
          }
          isLoading={isLoading}
        />
      </div>

      {/* BEHAVIORAL INSIGHTS SECTION */}
      {metrics && !isLoading && (
        <div className="bg-muted/30 rounded-lg p-4 space-y-3 mb-4">
          <h3 className="font-semibold text-sm text-primary/80">
            ML-Detected Behavioral Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground mb-1">Most Productive Days</p>
              <p className="font-medium text-green-600">
                {metrics.patterns.mostProductiveDays.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Vulnerable Days</p>
              <p className="font-medium text-orange-500">
                {metrics.patterns.vulnerableDays.length > 0
                  ? metrics.patterns.vulnerableDays.join(", ")
                  : "None detected"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Consistency Score</p>
              <p className="font-medium">
                {metrics.patterns.consistencyScore}/100
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COMPARATIVE ANALYTICS SECTION */}
      {metrics && !isLoading && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold text-sm text-primary/80 mb-3">
            Comparative Performance
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Percentile Rank:</span>
              <span className="font-medium">
                Top {100 - metrics.comparative.percentileRank}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Program Average:</span>
              <span className="font-medium">
                {metrics.comparative.programAverage}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <span
                className={
                  metrics.comparative.status === "above_average"
                    ? "text-green-600 font-semibold"
                    : metrics.comparative.status === "below_average"
                    ? "text-red-600 font-semibold"
                    : "font-medium"
                }
              >
                {metrics.comparative.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </DropDown>
  );
};

export default UserPerformance;
