// Utility functions for schedule management

export const toMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

export const fromMinutes = (totalMinutes: number) => {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
};

export const slotsOverlap = (
  slot1: { day_of_week: number; start_time: string; end_time: string },
  slot2: { day_of_week: number; start_time: string; end_time: string }
): boolean => {
  if (slot1.day_of_week !== slot2.day_of_week) return false;

  const start1 = toMinutes(slot1.start_time);
  const end1 = toMinutes(slot1.end_time);
  const start2 = toMinutes(slot2.start_time);
  const end2 = toMinutes(slot2.end_time);

  return !(end1 <= start2 || end2 <= start1);
};

/**
 * Finds the next available slot for a new schedule block
 * @param existingSlots - Array of existing schedule slots
 * @param durationMinutes - Duration of the new slot in minutes (default: 60)
 * @returns The next available slot with day_of_week, start_time, and end_time
 */
export const findNextAvailableSlot = (
  existingSlots: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>,
  durationMinutes: number = 60
): { day_of_week: number; start_time: string; end_time: string } => {
  // Sort existing slots by day and start time
  const sortedSlots = [...existingSlots].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return toMinutes(a.start_time) - toMinutes(b.start_time);
  });

  // Check each day of the week
  for (let day = 0; day < 7; day++) {
    const daySlots = sortedSlots.filter((slot) => slot.day_of_week === day);

    if (daySlots.length === 0) {
      // No slots on this day, use 8:00 AM
      return {
        day_of_week: day,
        start_time: "08:00",
        end_time: fromMinutes(toMinutes("08:00") + durationMinutes),
      };
    }

    // Check for gaps between existing slots
    for (let i = 0; i < daySlots.length; i++) {
      const currentSlot = daySlots[i];
      const nextSlot = daySlots[i + 1];

      const currentEnd = toMinutes(currentSlot.end_time);
      const nextStart = nextSlot ? toMinutes(nextSlot.start_time) : 24 * 60; // End of day

      const gapDuration = nextStart - currentEnd;

      if (gapDuration >= durationMinutes) {
        // Found a gap big enough
        return {
          day_of_week: day,
          start_time: currentSlot.end_time,
          end_time: fromMinutes(currentEnd + durationMinutes),
        };
      }
    }

    // Check if we can add after the last slot of the day
    const lastSlot = daySlots[daySlots.length - 1];
    const lastSlotEnd = toMinutes(lastSlot.end_time);
    const endOfDay = 24 * 60;

    if (endOfDay - lastSlotEnd >= durationMinutes) {
      return {
        day_of_week: day,
        start_time: lastSlot.end_time,
        end_time: fromMinutes(lastSlotEnd + durationMinutes),
      };
    }
  }

  // If no space found, start a new day (Sunday 8:00 AM)
  return {
    day_of_week: 0,
    start_time: "08:00",
    end_time: fromMinutes(toMinutes("08:00") + durationMinutes),
  };
};

/**
 * Checks if a slot overlaps with any existing slots
 * @param newSlot - The slot to check
 * @param existingSlots - Array of existing slots
 * @returns Array of overlapping slots
 */
export const findOverlappingSlots = (
  newSlot: { day_of_week: number; start_time: string; end_time: string },
  existingSlots: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>
): Array<{ day_of_week: number; start_time: string; end_time: string }> => {
  return existingSlots.filter((slot) => slotsOverlap(newSlot, slot));
};

/**
 * Suggests alternative times for a slot that has overlaps
 * @param overlappingSlot - The slot with overlaps
 * @param existingSlots - Array of existing slots
 * @param durationMinutes - Duration of the slot in minutes
 * @returns Array of suggested alternative slots
 */
export const suggestAlternativeSlots = (
  overlappingSlot: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  },
  existingSlots: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>,
  durationMinutes: number = 60
): Array<{ day_of_week: number; start_time: string; end_time: string }> => {
  const suggestions: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }> = [];

  // Try the same day with different times
  const daySlots = existingSlots.filter(
    (slot) => slot.day_of_week === overlappingSlot.day_of_week
  );
  const sortedDaySlots = daySlots.sort(
    (a, b) => toMinutes(a.start_time) - toMinutes(b.start_time)
  );

  // Check before first slot
  if (sortedDaySlots.length > 0) {
    const firstSlot = sortedDaySlots[0];
    const firstStart = toMinutes(firstSlot.start_time);
    if (firstStart >= durationMinutes) {
      const suggestion = {
        day_of_week: overlappingSlot.day_of_week,
        start_time: "08:00",
        end_time: fromMinutes(toMinutes("08:00") + durationMinutes),
      };
      if (findOverlappingSlots(suggestion, existingSlots).length === 0) {
        suggestions.push(suggestion);
      }
    }
  }

  // Check gaps between slots
  for (let i = 0; i < sortedDaySlots.length - 1; i++) {
    const currentSlot = sortedDaySlots[i];
    const nextSlot = sortedDaySlots[i + 1];

    const currentEnd = toMinutes(currentSlot.end_time);
    const nextStart = toMinutes(nextSlot.start_time);
    const gapDuration = nextStart - currentEnd;

    if (gapDuration >= durationMinutes) {
      const suggestion = {
        day_of_week: overlappingSlot.day_of_week,
        start_time: currentSlot.end_time,
        end_time: fromMinutes(currentEnd + durationMinutes),
      };
      if (findOverlappingSlots(suggestion, existingSlots).length === 0) {
        suggestions.push(suggestion);
      }
    }
  }

  // Try other days
  for (let day = 0; day < 7; day++) {
    if (day === overlappingSlot.day_of_week) continue;

    const daySlots = existingSlots.filter((slot) => slot.day_of_week === day);
    if (daySlots.length === 0) {
      // No slots on this day
      suggestions.push({
        day_of_week: day,
        start_time: "08:00",
        end_time: fromMinutes(toMinutes("08:00") + durationMinutes),
      });
    } else {
      // Find gaps on this day
      const sortedSlots = daySlots.sort(
        (a, b) => toMinutes(a.start_time) - toMinutes(b.start_time)
      );

      // Check before first slot
      const firstSlot = sortedSlots[0];
      const firstStart = toMinutes(firstSlot.start_time);
      if (firstStart >= durationMinutes) {
        suggestions.push({
          day_of_week: day,
          start_time: "08:00",
          end_time: fromMinutes(toMinutes("08:00") + durationMinutes),
        });
      }

      // Check gaps between slots
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const currentSlot = sortedSlots[i];
        const nextSlot = sortedSlots[i + 1];

        const currentEnd = toMinutes(currentSlot.end_time);
        const nextStart = toMinutes(nextSlot.start_time);
        const gapDuration = nextStart - currentEnd;

        if (gapDuration >= durationMinutes) {
          suggestions.push({
            day_of_week: day,
            start_time: currentSlot.end_time,
            end_time: fromMinutes(currentEnd + durationMinutes),
          });
        }
      }
    }
  }

  return suggestions.slice(0, 3); // Return max 3 suggestions
};
