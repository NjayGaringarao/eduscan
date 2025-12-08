export interface PerformanceMetrics {
  // Statistical Analysis
  averagePunctuality: {
    value: number | null; // in minutes, negative = late, positive = early
  };

  averageTimeBalance: {
    value: number | null;
  };

  // ML Predictions
  attendanceForecast: {
    probability: number | null; // 0-1, predicted attendance probability
    confidence: number | null; // 0-100
    factors: string[];
  };

  // Attendance Rate
  attendanceRate: {
    rate: number | null;
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
  user_type: "STUDENT" | "EMPLOYEE" | "ALL";
  average_punctuality: number | null;
  average_time_balance: number | null;
  attendance_rate: number | null;
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
