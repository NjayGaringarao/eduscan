export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

export const VALID_ACTIONS = ["TIME_IN", "TIME_OUT"] as const;

// Time-related constants
export const GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes
export const EARLY_ARRIVAL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const LATE_THRESHOLD_MINUTES = 15;
export const EARLY_THRESHOLD_MINUTES = 5;
export const TIMEZONE_OFFSET_HOURS = 8; // Manila UTC+8
