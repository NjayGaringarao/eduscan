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

  // First pass: Find slots where arrival is within the actual slot time (start_time to end_time)
  let exactMatch: {
    slot: (typeof slots)[0];
    slotStart: Date;
    slotEnd: Date;
  } | null = null;

  for (const slot of slots) {
    const [startHours, startMinutes] = slot.start_time.split(":").map(Number);
    const [endHours, endMinutes] = slot.end_time.split(":").map(Number);

    const slotStart = new Date(manilaArrival);
    slotStart.setUTCHours(startHours, startMinutes, 0, 0);

    const slotEnd = new Date(manilaArrival);
    slotEnd.setUTCHours(endHours, endMinutes, 0, 0);

    // Check if arrival is within the actual slot time (no grace period)
    if (
      manilaArrival.getTime() >= slotStart.getTime() &&
      manilaArrival.getTime() <= slotEnd.getTime()
    ) {
      exactMatch = { slot, slotStart, slotEnd };
      break; // Found exact match, use this one
    }
  }

  // If exact match found, use it
  if (exactMatch) {
    slotId = exactMatch.slot.id;
    slotData = {
      start_time: exactMatch.slot.start_time,
      end_time: exactMatch.slot.end_time,
      label: exactMatch.slot.label,
    };

    punctuality = Math.round(
      (exactMatch.slotStart.getTime() - manilaArrival.getTime()) / 60000
    );

    if (punctuality < LATE_THRESHOLD_MINUTES) {
      remarks = "LATE";
    } else if (punctuality > EARLY_THRESHOLD_MINUTES) {
      remarks = "EARLY";
    } else {
      remarks = "ON_TIME";
    }

    return { slotId, slotData, punctuality, remarks };
  }

  // Second pass: Find the closest slot by start_time within grace period windows
  // Only match slots that are current or upcoming, not past slots
  let bestMatch: {
    slot: (typeof slots)[0];
    slotStart: Date;
    slotEnd: Date;
    distance: number;
    isUpcoming: boolean; // Track if slot is upcoming (arrival before slot start)
  } | null = null;

  for (const slot of slots) {
    const [startHours, startMinutes] = slot.start_time.split(":").map(Number);
    const [endHours, endMinutes] = slot.end_time.split(":").map(Number);

    const slotStart = new Date(manilaArrival);
    slotStart.setUTCHours(startHours, startMinutes, 0, 0);

    const slotEnd = new Date(manilaArrival);
    slotEnd.setUTCHours(endHours, endMinutes, 0, 0);

    const earliestAllowed = slotStart.getTime() - EARLY_ARRIVAL_WINDOW_MS;
    // Don't allow matching past slots - only match if arrival is before or at slot end
    const latestAllowed = slotEnd.getTime();

    // Only match if arrival is:
    // 1. Early (before slot start, within early window), OR
    // 2. Within slot time (start to end)
    // NOT if arrival is after slot end
    if (
      manilaArrival.getTime() >= earliestAllowed &&
      manilaArrival.getTime() <= latestAllowed
    ) {
      // Calculate distance from arrival to slot start time
      const distance = Math.abs(slotStart.getTime() - manilaArrival.getTime());

      // Check if this is an upcoming slot (arrival is before slot start)
      const isUpcoming = manilaArrival.getTime() < slotStart.getTime();

      // Keep the best match with priority:
      // 1. Upcoming slots over past/current slots
      // 2. Closest distance
      // 3. If tied, prefer later slot
      if (!bestMatch) {
        bestMatch = { slot, slotStart, slotEnd, distance, isUpcoming };
      } else {
        // Prioritize upcoming slots
        if (isUpcoming && !bestMatch.isUpcoming) {
          bestMatch = { slot, slotStart, slotEnd, distance, isUpcoming };
        } else if (!isUpcoming && bestMatch.isUpcoming) {
          // Keep current best (it's upcoming)
          // Do nothing
        } else {
          // Both are same type (both upcoming or both current/past)
          // Choose by distance, then by later slot if tied
          if (
            distance < bestMatch.distance ||
            (distance === bestMatch.distance &&
              slotStart.getTime() > bestMatch.slotStart.getTime())
          ) {
            bestMatch = { slot, slotStart, slotEnd, distance, isUpcoming };
          }
        }
      }
    }
  }

  // If we found a match within grace period, use it
  if (bestMatch) {
    slotId = bestMatch.slot.id;
    slotData = {
      start_time: bestMatch.slot.start_time,
      end_time: bestMatch.slot.end_time,
      label: bestMatch.slot.label,
    };

    punctuality = Math.round(
      (bestMatch.slotStart.getTime() - manilaArrival.getTime()) / 60000
    );

    if (punctuality < LATE_THRESHOLD_MINUTES) {
      remarks = "LATE";
    } else if (punctuality > EARLY_THRESHOLD_MINUTES) {
      remarks = "EARLY";
    } else {
      remarks = "ON_TIME";
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
