import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { ScheduleCalculationResult, SlotData } from "./types.ts";
import {
  GRACE_PERIOD_MS,
  EARLY_ARRIVAL_WINDOW_MS,
  LATE_THRESHOLD_MINUTES,
  EARLY_THRESHOLD_MINUTES,
  TIMEZONE_OFFSET_HOURS,
} from "./constants.ts";

export interface SlotMatchResult {
  slotId: bigint | null;
  slotData: SlotData | null;
  punctuality: number | null;
  remarks: string;
}

export async function findMatchingSlotAtArrival(
  supabase: SupabaseClient,
  scheduleId: bigint | null,
  arrival: Date
): Promise<SlotMatchResult> {
  let slotId = null;
  let slotData = null;
  let punctuality = null;
  let remarks = "UNSCHEDULED";

  if (!scheduleId) {
    return { slotId, slotData, punctuality, remarks };
  }

  // Convert UTC arrival to Manila timezone (+8:00)
  // All comparisons should happen in Manila time since slot times are in Manila
  const manilaArrival = new Date(
    arrival.getTime() + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000
  );
  const dayOfWeek = manilaArrival.getUTCDay();

  // Get all slots for this schedule and day
  const { data: slots, error: slotError } = await supabase
    .from("slot")
    .select("id, start_time, end_time, label")
    .eq("schedule_id", scheduleId)
    .eq("day_of_week", dayOfWeek)
    .order("start_time");

  if (slotError || !slots || slots.length === 0) {
    return { slotId, slotData, punctuality, remarks };
  }

  // Find the slot that matches Manila arrival time
  for (const slot of slots) {
    const [startHours, startMinutes] = slot.start_time.split(":").map(Number);
    const [endHours, endMinutes] = slot.end_time.split(":").map(Number);

    // Create slot times using Manila arrival's date
    // Slot times are already in Manila time, so we just set them directly
    const slotStart = new Date(manilaArrival);
    slotStart.setUTCHours(startHours, startMinutes, 0, 0);

    const slotEnd = new Date(manilaArrival);
    slotEnd.setUTCHours(endHours, endMinutes, 0, 0);

    // Check if Manila arrival falls within acceptable window
    // Allow up to 2 hours early, and up to 30 minutes after slot ends
    const earliestAllowed = slotStart.getTime() - EARLY_ARRIVAL_WINDOW_MS;
    const latestAllowed = slotEnd.getTime() + GRACE_PERIOD_MS;

    if (
      manilaArrival.getTime() >= earliestAllowed &&
      manilaArrival.getTime() <= latestAllowed
    ) {
      slotId = slot.id;
      slotData = {
        start_time: slot.start_time,
        end_time: slot.end_time,
        label: slot.label,
      };

      // Calculate arrival offset in minutes (using Manila times)
      // Negative = late (arrived after scheduled start)
      // Positive = early (arrived before scheduled start)
      punctuality = Math.round(
        (slotStart.getTime() - manilaArrival.getTime()) / 60000
      );

      // Determine remarks based on offset
      if (punctuality < LATE_THRESHOLD_MINUTES) {
        remarks = "LATE";
      } else if (punctuality > EARLY_THRESHOLD_MINUTES) {
        remarks = "EARLY";
      } else {
        remarks = "ON_TIME"; // Within 15 minutes of scheduled time
      }

      break;
    }
  }

  return { slotId, slotData, punctuality, remarks };
}

export async function calculateScheduleRemarks(
  supabase: SupabaseClient,
  scheduleId: string | null,
  arrival: Date,
  departure: Date
): Promise<ScheduleCalculationResult> {
  let punctuality = null;
  let remarks = "UNSCHEDULED"; // Default value

  const debugInfo: any = {
    hasSchedule: !!scheduleId,
    scheduleId: scheduleId,
    dayOfWeek: null,
    slotFound: false,
    slotError: null,
    timeCalculation: null,
  };

  if (!scheduleId) {
    return { punctuality, remarks, matchedSlot: null, debugInfo };
  }

  // Get the schedule slot for today
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  debugInfo.dayOfWeek = dayOfWeek;

  // Step 1: Get ALL slots for this schedule and day
  const { data: allSlots, error: slotError } = await supabase
    .from("slot")
    .select("start_time, end_time, label")
    .eq("schedule_id", scheduleId)
    .eq("day_of_week", dayOfWeek)
    .order("start_time");

  debugInfo.slotError = slotError?.message;

  // Step 2: Check which slot the session overlaps with
  let matchingSlot: SlotData | null = null;
  if (!slotError && allSlots && allSlots.length > 0) {
    debugInfo.slotFound = true;

    for (const slot of allSlots) {
      // Parse slot times
      const [startHours, startMinutes] = slot.start_time.split(":").map(Number);
      const [endHours, endMinutes] = slot.end_time.split(":").map(Number);

      // Create time objects for comparison (using same date)
      const slotStart = new Date();
      slotStart.setHours(startHours, startMinutes, 0, 0);

      const slotEnd = new Date();
      slotEnd.setHours(endHours, endMinutes, 0, 0);

      // Add 30-minute grace period before end_time
      const effectiveSlotEnd = new Date(slotEnd.getTime() - GRACE_PERIOD_MS);

      // Check if session overlaps with this slot (with grace period)
      // Session overlaps if: arrival < effectiveSlotEnd && departure > slotStart
      if (
        arrival.getTime() < effectiveSlotEnd.getTime() &&
        departure.getTime() > slotStart.getTime()
      ) {
        matchingSlot = slot;
        break; // Use the first overlapping slot
      }
    }
  }

  // Step 3: Calculate based on overlap
  if (matchingSlot) {
    debugInfo.slotFound = true;

    // Parse the start_time and calculate offset
    const [hours, minutes] = matchingSlot.start_time.split(":").map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // Calculate offset in minutes (negative = late, positive = early)
    punctuality = Math.round(
      (scheduledTime.getTime() - arrival.getTime()) / 60000
    );

    debugInfo.timeCalculation = {
      arrival: arrival.toISOString(),
      scheduledTime: scheduledTime.toISOString(),
      punctuality,
      matchedSlot: matchingSlot,
    };

    // Set remarks based on offset
    if (punctuality >= LATE_THRESHOLD_MINUTES) {
      remarks = "LATE";
    } else if (punctuality <= EARLY_THRESHOLD_MINUTES) {
      remarks = "EARLY";
    } else {
      remarks = "ON_TIME";
    }
  } else {
    // No overlapping slot found (or session ended too close to slot end)
    debugInfo.slotFound = false;
    remarks = "UNSCHEDULED";
  }

  return { punctuality, remarks, matchedSlot, debugInfo };
}
