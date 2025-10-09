import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { ScheduleCalculationResult, SlotData } from "./types.ts";
import {
  GRACE_PERIOD_MS,
  LATE_THRESHOLD_MINUTES,
  EARLY_THRESHOLD_MINUTES,
} from "./constants.ts";

export async function calculateScheduleRemarks(
  supabase: SupabaseClient,
  scheduleId: string | null,
  arrival: Date,
  departure: Date
): Promise<ScheduleCalculationResult> {
  let arrivalOffsetMinute = null;
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
    return { arrivalOffsetMinute, remarks, debugInfo };
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
    arrivalOffsetMinute = Math.round(
      (arrival.getTime() - scheduledTime.getTime()) / 60000
    );

    debugInfo.timeCalculation = {
      arrival: arrival.toISOString(),
      scheduledTime: scheduledTime.toISOString(),
      arrivalOffsetMinute,
      matchedSlot: matchingSlot,
    };

    // Set remarks based on offset
    if (arrivalOffsetMinute <= LATE_THRESHOLD_MINUTES) {
      remarks = "LATE";
    } else if (arrivalOffsetMinute >= EARLY_THRESHOLD_MINUTES) {
      remarks = "EARLY";
    } else {
      remarks = "ON_TIME";
    }
  } else {
    // No overlapping slot found (or session ended too close to slot end)
    debugInfo.slotFound = false;
    remarks = "UNSCHEDULED";
  }

  return { arrivalOffsetMinute, remarks, debugInfo };
}
