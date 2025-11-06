import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { Action, DebugInfo } from "./types.ts";
import { findMatchingSlotAtArrival } from "./schedule-utils.ts";

interface SessionResult {
  success: boolean;
  error?: string;
  debugInfo?: DebugInfo;
}

export async function handleTimeIn(
  supabase: SupabaseClient,
  user_id: string
): Promise<SessionResult> {
  // Get user's schedule_id
  const { data: userData, error: userError } = await supabase
    .from("user")
    .select("schedule_id")
    .eq("id", user_id)
    .single();

  if (userError) {
    return {
      success: false,
      error: `User fetch failed: ${userError.message}`,
    };
  }

  const arrival = new Date();

  // Find matching slot and calculate arrival metrics at TIME_IN
  const slotMatch = await findMatchingSlotAtArrival(
    supabase,
    userData.schedule_id,
    arrival
  );

  // Create new session arrival metrics
  const { error: sessionError } = await supabase.from("session").insert({
    user_id: user_id,
    arrival: arrival.toISOString(),
    departure: null,
    duration: null,
    time_balance: null,
    is_active: true,
    punctuality: slotMatch.punctuality, // optional mapping
    remarks: slotMatch.remarks,
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
  user_id: string
): Promise<SessionResult> {
  // Get current active session
  const { data: currentSession, error: sessionFetchError } = await supabase
    .from("session")
    .select("*")
    .eq("user_id", user_id)
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

  // Calculate duration (total session time: departure - arrival)
  const durationMs = departure.getTime() - arrival.getTime();
  const durationInterval = `${Math.floor(durationMs / 60000)} minutes`;
  const actualDurationMinutes = Math.floor(durationMs / 60000);

  // Calculate time_balance: find slot at arrival time and compute difference
  let timeBalance: number | null = null;

  // Get user's schedule_id to find matching slot
  const { data: userData, error: userError } = await supabase
    .from("user")
    .select("schedule_id")
    .eq("id", user_id)
    .single();

  if (!userError && userData?.schedule_id) {
    // Find matching slot at arrival time
    const slotMatch = await findMatchingSlotAtArrival(
      supabase,
      userData.schedule_id,
      arrival
    );

    if (slotMatch.slotData) {
      // Parse slot start_time and end_time (HH:MM format)
      const [startHours, startMinutes] = slotMatch.slotData.start_time
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = slotMatch.slotData.end_time
        .split(":")
        .map(Number);

      // Calculate slot duration in minutes
      const slotStartMinutes = startHours * 60 + startMinutes;
      const slotEndMinutes = endHours * 60 + endMinutes;
      const slotDurationMinutes = slotEndMinutes - slotStartMinutes;

      // Calculate time_balance: actual duration - slot duration
      // Positive = overtime (worked more than required)
      // Negative = undertime (worked less than required)
      timeBalance = actualDurationMinutes - slotDurationMinutes;
    }
  }

  // Update session
  const { error: sessionError } = await supabase
    .from("session")
    .update({
      departure: departure.toISOString(),
      duration: durationInterval,
      time_balance: timeBalance,
      is_active: false,
    })
    .eq("user_id", user_id)
    .eq("is_active", true);

  if (sessionError) {
    return {
      success: false,
      error: `Session update failed: ${sessionError.message}`,
    };
  }

  return {
    success: true,
  };
}

export async function handleSession(
  supabase: SupabaseClient,
  user_id: string,
  action: Action
): Promise<SessionResult> {
  if (action === "TIME_IN") {
    return await handleTimeIn(supabase, user_id);
  } else {
    return await handleTimeOut(supabase, user_id);
  }
}
