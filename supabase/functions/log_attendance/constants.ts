export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

export const VALID_ACTIONS = ["TIME_IN", "TIME_OUT"] as const;
export const GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes in milliseconds
export const LATE_THRESHOLD_MINUTES = -15;
export const EARLY_THRESHOLD_MINUTES = 15;
