"use client";

import React from "react";
import { EmployeeScheduleFormat } from "@/utils/employeeScheduleUtils";
import EmployeeTimeBlock from "./TimeBlock";
import { cn } from "@/utils/style";

interface EmployeeScheduleFormProps {
  schedule: EmployeeScheduleFormat;
  disabled?: boolean;
  onChange: (schedule: EmployeeScheduleFormat) => void;
}

const EmployeeScheduleForm = ({
  schedule,
  disabled = false,
  onChange,
}: EmployeeScheduleFormProps) => {
  const handleRegularDaysAmChange = (startTime: string, endTime: string) => {
    onChange({
      ...schedule,
      regularDays: {
        ...schedule.regularDays,
        am: { start_time: startTime, end_time: endTime },
      },
    });
  };

  const handleRegularDaysPmChange = (startTime: string, endTime: string) => {
    onChange({
      ...schedule,
      regularDays: {
        ...schedule.regularDays,
        pm: { start_time: startTime, end_time: endTime },
      },
    });
  };

  const handleSaturdaysAmChange = (startTime: string, endTime: string) => {
    onChange({
      ...schedule,
      saturdays: {
        ...schedule.saturdays,
        am: { start_time: startTime, end_time: endTime },
      },
    });
  };

  const handleSaturdaysPmChange = (startTime: string, endTime: string) => {
    onChange({
      ...schedule,
      saturdays: {
        ...schedule.saturdays,
        pm: { start_time: startTime, end_time: endTime },
      },
    });
  };

  // Get disabled slots for validation (prevent overlapping times on same day)
  // Excludes the block being edited to avoid self-overlap warnings
  const getDisabledSlots = (dayOfWeek: number, excludeBlock?: "am" | "pm") => {
    const disabled: Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
    }> = [];

    // For regular days (Mon-Fri), add the other time block as disabled
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (schedule.regularDays.am && excludeBlock !== "am") {
        disabled.push({
          day_of_week: dayOfWeek,
          start_time: schedule.regularDays.am.start_time,
          end_time: schedule.regularDays.am.end_time,
        });
      }
      if (schedule.regularDays.pm && excludeBlock !== "pm") {
        disabled.push({
          day_of_week: dayOfWeek,
          start_time: schedule.regularDays.pm.start_time,
          end_time: schedule.regularDays.pm.end_time,
        });
      }
    }

    // For Saturday, add the other time block as disabled
    if (dayOfWeek === 6) {
      if (schedule.saturdays.am && excludeBlock !== "am") {
        disabled.push({
          day_of_week: dayOfWeek,
          start_time: schedule.saturdays.am.start_time,
          end_time: schedule.saturdays.am.end_time,
        });
      }
      if (schedule.saturdays.pm && excludeBlock !== "pm") {
        disabled.push({
          day_of_week: dayOfWeek,
          start_time: schedule.saturdays.pm.start_time,
          end_time: schedule.saturdays.pm.end_time,
        });
      }
    }

    return disabled;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2 items-center">
        <h3 className="text-lg font-medium text-primary">Time Blocks</h3>
        <i className="text-textBody">(atleast one (1) required)</i>
      </div>

      <div className={cn("grid grid-cols-1 md:grid-cols-2 w-full gap-4")}>
        <div
          className={cn(
            "bg-secondary",
            "flex flex-col gap-4",
            "p-4 border border-primary/40 rounded-md"
          )}
        >
          <h3 className="text-lg font-medium text-primary">Monday - Friday</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EmployeeTimeBlock
              label="AM"
              dayOfWeek={1}
              startTime={schedule.regularDays.am?.start_time || ""}
              endTime={schedule.regularDays.am?.end_time || ""}
              disabled={disabled}
              disabledSlots={getDisabledSlots(1, "am")}
              onChange={handleRegularDaysAmChange}
            />

            <EmployeeTimeBlock
              label="PM"
              dayOfWeek={1}
              startTime={schedule.regularDays.pm?.start_time || ""}
              endTime={schedule.regularDays.pm?.end_time || ""}
              disabled={disabled}
              disabledSlots={getDisabledSlots(1, "pm")}
              onChange={handleRegularDaysPmChange}
            />
          </div>
        </div>

        <div
          className={cn(
            "bg-secondary",
            "flex flex-col gap-4",
            "p-4 border border-primary/40 rounded-md"
          )}
        >
          <h3 className="text-lg font-medium text-primary ">Saturday</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EmployeeTimeBlock
              label="AM"
              dayOfWeek={6}
              startTime={schedule.saturdays.am?.start_time || ""}
              endTime={schedule.saturdays.am?.end_time || ""}
              disabled={disabled}
              disabledSlots={getDisabledSlots(6, "am")}
              onChange={handleSaturdaysAmChange}
            />

            <EmployeeTimeBlock
              label="PM"
              dayOfWeek={6}
              startTime={schedule.saturdays.pm?.start_time || ""}
              endTime={schedule.saturdays.pm?.end_time || ""}
              disabled={disabled}
              disabledSlots={getDisabledSlots(6, "pm")}
              onChange={handleSaturdaysPmChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeScheduleForm;
