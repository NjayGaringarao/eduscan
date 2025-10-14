export interface PerformanceMetrics {
  // Current Status
  currentStatus: {
    isActive: boolean;
    elapsedTime: string;
  };

  // Core Metrics (Descriptive Analytics)
  averageArrivalOffset: {
    value: number; // in minutes, negative = early, positive = late
    label: string; // "5 Minutes Early" or "12 Minutes Late"
    trend: "improving" | "declining" | "stable";
  };

  averageUndertime: {
    value: number; // in minutes
    label: string;
    trend: "improving" | "declining" | "stable";
  };

  // Removed: attendanceRate - Cannot be calculated without absence tracking system
  // The database only stores actual sessions, not expected vs actual attendance

  punctualityScore: {
    value: number; // 0-100
    label: string;
    onTimeRate: number; // percentage
  };

  // ML-Powered Predictions (Predictive Analytics)
  riskScore: {
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    percentage: number;
    confidence: number; // model confidence 0-100
    factors: string[]; // ["Declining attendance", "Increased lateness"]
  };

  performanceTrend: {
    direction: "improving" | "declining" | "stable";
    changePercent: number; // +5% or -8%
    description: string;
  };

  // Forecasting
  nextWeekPrediction: {
    attendanceRate: number;
    confidence: number;
  };

  // Behavioral Patterns (ML-detected)
  patterns: {
    mostProductiveDays: string[]; // ["Monday", "Wednesday"]
    vulnerableDays: string[]; // ["Friday"]
    consistencyScore: number; // 0-100
  };

  // Comparative Analytics
  comparative: {
    percentileRank: number; // vs peers
    programAverage: number;
    status: "above_average" | "average" | "below_average";
  };

  // Data freshness
  lastUpdated: Date;
  dataPoints: number; // number of sessions analyzed
}

export interface PerformanceApiResponse {
  success: boolean;
  data?: PerformanceMetrics;
  error?: string;
  message?: string;
}
