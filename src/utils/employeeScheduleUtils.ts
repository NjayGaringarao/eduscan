import { Slot } from "@/models/schedule";

export type EmployeeScheduleFormat = {
  regularDays: {
    am: { start_time: string; end_time: string } | null;
    pm: { start_time: string; end_time: string } | null;
  };
  saturdays: {
    am: { start_time: string; end_time: string } | null;
    pm: { start_time: string; end_time: string } | null;
  };
};

/**
 * Converts an array of slots to employee schedule format
 * Extracts Regular Days (Mon-Fri, days 1-5) and Saturdays (day 6) schedules
 */
export function slotsToEmployeeFormat(slots: Slot[]): EmployeeScheduleFormat {
  const format: EmployeeScheduleFormat = {
    regularDays: {
      am: null,
      pm: null,
    },
    saturdays: {
      am: null,
      pm: null,
    },
  };

  // Helper to convert time string to minutes for comparison
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  };

  // Process Regular Days (Mon-Fri, days 1-5)
  const regularDaySlots = slots.filter(
    (slot) => slot.day_of_week >= 1 && slot.day_of_week <= 5
  );

  if (regularDaySlots.length > 0) {
    // Sort by start_time to find AM (earliest) and PM (latest)
    const sortedSlots = [...regularDaySlots].sort(
      (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );

    // AM slot is the earliest slot (typically ends before noon)
    const amSlot = sortedSlots.find(
      (slot) => timeToMinutes(slot.end_time) <= 12 * 60
    ) || sortedSlots[0];

    // PM slot is the latest slot (typically starts after noon or is after AM)
    const pmSlot =
      sortedSlots.find(
        (slot) => timeToMinutes(slot.start_time) >= 12 * 60
      ) || sortedSlots[sortedSlots.length - 1];

    // If only one slot exists, determine if it's AM or PM based on time
    if (sortedSlots.length === 1) {
      const singleSlot = sortedSlots[0];
      if (timeToMinutes(singleSlot.end_time) <= 12 * 60) {
        format.regularDays.am = {
          start_time: singleSlot.start_time,
          end_time: singleSlot.end_time,
        };
      } else {
        format.regularDays.pm = {
          start_time: singleSlot.start_time,
          end_time: singleSlot.end_time,
        };
      }
    } else {
      // Multiple slots: assign AM and PM
      if (amSlot && amSlot.id !== pmSlot.id) {
        format.regularDays.am = {
          start_time: amSlot.start_time,
          end_time: amSlot.end_time,
        };
      }
      if (pmSlot && pmSlot.id !== amSlot.id) {
        format.regularDays.pm = {
          start_time: pmSlot.start_time,
          end_time: pmSlot.end_time,
        };
      }
    }
  }

  // Process Saturdays (day 6)
  const saturdaySlots = slots.filter((slot) => slot.day_of_week === 6);

  if (saturdaySlots.length > 0) {
    const sortedSaturdaySlots = [...saturdaySlots].sort(
      (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );

    // AM slot (earliest or ends before noon)
    const amSlot = sortedSaturdaySlots.find(
      (slot) => timeToMinutes(slot.end_time) <= 12 * 60
    ) || sortedSaturdaySlots[0];

    // PM slot (latest or starts after noon)
    const pmSlot =
      sortedSaturdaySlots.find(
        (slot) => timeToMinutes(slot.start_time) >= 12 * 60
      ) || sortedSaturdaySlots[sortedSaturdaySlots.length - 1];

    if (sortedSaturdaySlots.length === 1) {
      const singleSlot = sortedSaturdaySlots[0];
      if (timeToMinutes(singleSlot.end_time) <= 12 * 60) {
        format.saturdays.am = {
          start_time: singleSlot.start_time,
          end_time: singleSlot.end_time,
        };
      } else {
        format.saturdays.pm = {
          start_time: singleSlot.start_time,
          end_time: singleSlot.end_time,
        };
      }
    } else {
      if (amSlot && amSlot.id !== pmSlot.id) {
        format.saturdays.am = {
          start_time: amSlot.start_time,
          end_time: amSlot.end_time,
        };
      }
      if (pmSlot && pmSlot.id !== amSlot.id) {
        format.saturdays.pm = {
          start_time: pmSlot.start_time,
          end_time: pmSlot.end_time,
        };
      }
    }
  }

  return format;
}

/**
 * Converts employee schedule format to an array of 12 slots
 * Creates 2 slots per day for Mon-Fri (10 slots) and 2 slots for Saturday (2 slots)
 */
export function employeeFormatToSlots(
  employeeSchedule: EmployeeScheduleFormat,
  scheduleId: string
): Array<Omit<Slot, "id" | "schedule_id">> {
  const slots: Array<Omit<Slot, "id" | "schedule_id">> = [];

  // Create slots for Regular Days (Mon-Fri, days 1-5)
  if (employeeSchedule.regularDays.am || employeeSchedule.regularDays.pm) {
    for (let day = 1; day <= 5; day++) {
      if (employeeSchedule.regularDays.am) {
        slots.push({
          day_of_week: day,
          start_time: employeeSchedule.regularDays.am.start_time,
          end_time: employeeSchedule.regularDays.am.end_time,
          label: null,
        });
      }
      if (employeeSchedule.regularDays.pm) {
        slots.push({
          day_of_week: day,
          start_time: employeeSchedule.regularDays.pm.start_time,
          end_time: employeeSchedule.regularDays.pm.end_time,
          label: null,
        });
      }
    }
  }

  // Create slots for Saturday (day 6)
  if (employeeSchedule.saturdays.am || employeeSchedule.saturdays.pm) {
    if (employeeSchedule.saturdays.am) {
      slots.push({
        day_of_week: 6,
        start_time: employeeSchedule.saturdays.am.start_time,
        end_time: employeeSchedule.saturdays.am.end_time,
        label: null,
      });
    }
    if (employeeSchedule.saturdays.pm) {
      slots.push({
        day_of_week: 6,
        start_time: employeeSchedule.saturdays.pm.start_time,
        end_time: employeeSchedule.saturdays.pm.end_time,
        label: null,
      });
    }
  }

  return slots;
}

