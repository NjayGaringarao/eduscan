export interface PerformanceMetrics {
  // Statistical Analysis
  averagePunctuality: {
    value: number | null; // in minutes, negative = late, positive = early
    label: string; // "5 Minutes Early" or "12 Minutes Late"
    trend: "improving" | "declining" | "stable";
  };

  // ML Predictions
  dropoutRisk: {
    level: "NOT_AT_RISK" | "AT_RISK" | "No Data";
    percentage: number | null;
    confidence: number | null; // 0-100
    factors: string[];
  };

  // Attendance Rate
  attendanceRate: {
    rate: number | null;
    label: string;
    present: number | null;
    absent: number | null;
    total: number | null;
  };

  // Metadata
  lastUpdated: string;
  dataPoints: number | null; // number of sessions analyzed
}

export interface PerformanceApiResponse {
  success: boolean;
  data?: PerformanceMetrics;
  error?: string;
  message?: string;
}
