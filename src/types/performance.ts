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

export interface PerformanceTurnoverSnapshot {
  id: number;
  snapshot_date: string;
  user_type: "STUDENT" | "EMPLOYEE" | "ALL";
  average_punctuality: number | null;
  average_punctuality_label: string | null;
  average_punctuality_trend: "improving" | "declining" | "stable" | null;
  average_time_balance: number | null;
  average_time_balance_label: string | null;
  average_time_balance_trend: "improving" | "declining" | "stable" | null;
  attendance_rate: number | null;
  attendance_rate_label: string | null;
  total_users: number;
  at_risk_count: number;
  not_at_risk_count: number;
  created_at: string;
}

export interface PerformanceTurnoverTimeSeries {
  date: string;
  student?: PerformanceTurnoverSnapshot;
  employee?: PerformanceTurnoverSnapshot;
  all?: PerformanceTurnoverSnapshot;
}

export interface CurrentPerformanceTurnover {
  student: PerformanceTurnoverSnapshot | null;
  employee: PerformanceTurnoverSnapshot | null;
  all: PerformanceTurnoverSnapshot | null;
  trends?: {
    student?: {
      dayOverDay: number | null;
      weekOverWeek: number | null;
    };
    employee?: {
      dayOverDay: number | null;
      weekOverWeek: number | null;
    };
    all?: {
      dayOverDay: number | null;
      weekOverWeek: number | null;
    };
  };
}

