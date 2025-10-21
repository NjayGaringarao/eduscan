export interface PerformanceMetrics {
  // Statistical Analysis
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

  // ML Predictions
  dropoutRisk: {
    level: "LOW" | "MEDIUM" | "HIGH";
    percentage: number;
    confidence: number; // model confidence 0-100
    factors: string[]; // ["Declining attendance", "Increased lateness"]
  };

  predictedTrend: {
    trend: "STABLE" | "IMPROVING" | "DECLINING" | "RANDOM";
    confidence: number;
    description: string;
  };

  // Metadata
  lastUpdated: string;
  dataPoints: number; // number of sessions analyzed
}

export interface PerformanceApiResponse {
  success: boolean;
  data?: PerformanceMetrics;
  error?: string;
  message?: string;
}
