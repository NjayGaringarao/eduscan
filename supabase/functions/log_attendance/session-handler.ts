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

  const arrival = new Date();

  // Find matching slot and calculate arrival metrics at TIME_IN
  const slotMatch = await findMatchingSlotAtArrival(
    supabase,
    userData.schedule_id,
    arrival
  );

  // Create new session with slot_id and arrival metrics
  const { error: sessionError } = await supabase.from("session").insert({
    user_id: userId,
    slot_id: slotMatch.slotId,
    arrival: arrival.toISOString(),
    departure: null,
    duration: null,
    undertime: null,
    is_active: true,
    arrival_offset_minute: slotMatch.arrivalOffsetMinute,
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

  // Calculate duration (total session time: departure - arrival)
  const durationMs = departure.getTime() - arrival.getTime();
  const durationInterval = `${Math.floor(durationMs / 60000)} minutes`;

  // Calculate undertime (hours required but not worked)
  let undertimeInterval = null;

  // If there's a slot_id, calculate based on slot duration
  if (currentSession.slot_id) {
    const { data: slot, error: slotError } = await supabase
      .from("slot")
      .select("start_time, end_time")
      .eq("slot_id", currentSession.slot_id)
      .single();

    if (!slotError && slot) {
      // Parse slot times
      const [startHours, startMinutes] = slot.start_time.split(":").map(Number);
      const [endHours, endMinutes] = slot.end_time.split(":").map(Number);

      // Calculate required minutes in slot
      const requiredMinutes =
        endHours * 60 + endMinutes - (startHours * 60 + startMinutes);

      // Calculate actual minutes worked
      const actualMinutes = Math.floor(durationMs / 60000);

      // Undertime = required hours - actual hours worked
      const undertimeMinutes = requiredMinutes - actualMinutes;

      // Only set undertime if positive (didn't complete required hours)
      if (undertimeMinutes > 0) {
        undertimeInterval = `${undertimeMinutes} minutes`;
      }
    }
  }

  // Update session
  const { error: sessionError } = await supabase
    .from("session")
    .update({
      departure: departure.toISOString(),
      duration: durationInterval,
      undertime: undertimeInterval,
      is_active: false,
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
