import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { Action, DebugInfo } from "./types.ts";
import { calculateScheduleRemarks } from "./schedule-utils.ts";

interface SessionResult {
  success: boolean;
  error?: string;
  debugInfo?: DebugInfo;
}

export async function handleTimeIn(
  supabase: SupabaseClient,
  userId: string
): Promise<SessionResult> {
  // Get user's schedule_id
  const { data: userData, error: userError } = await supabase
    .from("user")
    .select("schedule_id")
    .eq("user_id", userId)
    .single();

  if (userError) {
    return {
      success: false,
      error: `User fetch failed: ${userError.message}`,
    };
  }

  // Create new session
  const { error: sessionError } = await supabase.from("session").insert({
    user_id: userId,
    schedule_id: userData.schedule_id || null,
    arrival: new Date().toISOString(),
    departure: null,
    undertime: null,
    is_active: true,
    arrival_offset_minute: null,
    remarks: null,
  });

  if (sessionError) {
    return {
      success: false,
      error: `Session insert failed: ${sessionError.message}`,
    };
  }

  return { success: true };
}

export async function handleTimeOut(
  supabase: SupabaseClient,
  userId: string
): Promise<SessionResult> {
  // Get current active session
  const { data: currentSession, error: sessionFetchError } = await supabase
    .from("session")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (sessionFetchError) {
    return {
      success: false,
      error: `Session fetch failed: ${sessionFetchError.message}`,
    };
  }

  const now = new Date();
  const arrival = new Date(currentSession.arrival);
  const departure = now;

  // Calculate undertime (duration between arrival and departure)
  const durationMs = departure.getTime() - arrival.getTime();
  const undertimeInterval = `${Math.floor(durationMs / 60000)} minutes`;

  // Calculate arrival offset and remarks if schedule exists
  const scheduleResult = await calculateScheduleRemarks(
    supabase,
    currentSession.schedule_id,
    arrival,
    departure
  );

  // Update session
  const { error: sessionError } = await supabase
    .from("session")
    .update({
      departure: departure.toISOString(),
      undertime: undertimeInterval,
      is_active: false,
      arrival_offset_minute: scheduleResult.arrivalOffsetMinute,
      remarks: scheduleResult.remarks,
    })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (sessionError) {
    return {
      success: false,
      error: `Session update failed: ${sessionError.message}`,
    };
  }

  return {
    success: true,
    debugInfo: scheduleResult.debugInfo as DebugInfo,
  };
}

export async function handleSession(
  supabase: SupabaseClient,
  userId: string,
  action: Action
): Promise<SessionResult> {
  if (action === "TIME_IN") {
    return await handleTimeIn(supabase, userId);
  } else {
    return await handleTimeOut(supabase, userId);
  }
}
