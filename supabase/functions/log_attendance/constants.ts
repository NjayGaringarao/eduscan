export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

export const VALID_ACTIONS = ["TIME_IN", "TIME_OUT"] as const;

// Time-related constants
export const GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes in milliseconds
export const EARLY_ARRIVAL_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours early allowed
export const LATE_THRESHOLD_MINUTES = -15; // Negative = late
export const EARLY_THRESHOLD_MINUTES = 15; // Positive = early
export const TIMEZONE_OFFSET_HOURS = 8; // Manila UTC+8
