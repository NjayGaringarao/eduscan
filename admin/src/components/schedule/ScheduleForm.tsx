"use client";

import React, { useState, useEffect, useRef } from "react";
import { Slot } from "@/models";
import { cn } from "@/utils/style";
import {
  EmployeeScheduleFormat,
  slotsToEmployeeFormat,
  employeeFormatToSlots,
} from "@/utils/employeeScheduleUtils";
import TextBox from "../TextBox";
import Select from "../Select";
import ParagraphBox from "../ParagraphBox";
import StudentScheduleForm from "./student/ScheduleForm";
import EmployeeScheduleForm from "./employee/ScheduleForm";

type UserType = "STUDENT" | "EMPLOYEE";

interface ScheduleFormState {
  name: string;
  description: string;
  user_type: UserType;
}

interface CreateMode {
  mode: "CREATE";
  isLoading: boolean;
  scheduleForm: ScheduleFormState;
  setScheduleForm: React.Dispatch<React.SetStateAction<ScheduleFormState>>;
  slots: Slot[];
  setSlots: React.Dispatch<React.SetStateAction<Slot[]>>;
}

interface EditMode {
  mode: "EDIT";
  isLoading: boolean;
  scheduleForm: ScheduleFormState;
  setScheduleForm: React.Dispatch<React.SetStateAction<ScheduleFormState>>;
  slots: Slot[];
  setSlots: React.Dispatch<React.SetStateAction<Slot[]>>;
}

type ScheduleFormProps = CreateMode | EditMode;

const ScheduleForm = (props: ScheduleFormProps) => {
  const { mode, isLoading, scheduleForm, setScheduleForm, slots, setSlots } =
    props;
  const { name, description, user_type: userType } = scheduleForm;

  // Employee schedule format state (only used when user_type is EMPLOYEE)
  const [employeeSchedule, setEmployeeSchedule] =
    useState<EmployeeScheduleFormat>({
      regularDays: { am: null, pm: null },
      saturdays: { am: null, pm: null },
    });

  // Track if we're updating slots from employee schedule (to prevent circular updates)
  const isUpdatingFromEmployeeSchedule = useRef(false);
  // Track if user_type just changed (to handle reset properly)
  const userTypeChangedRef = useRef(false);

  // Sync employee schedule format with slots when user_type is EMPLOYEE
  // Only sync when slots change externally (e.g., loading from database in edit mode)
  // Not when we're updating slots from employee schedule changes
  useEffect(() => {
    // Skip sync if we're currently updating from employee schedule change
    if (isUpdatingFromEmployeeSchedule.current) {
      isUpdatingFromEmployeeSchedule.current = false;
      return;
    }

    // Only process if user_type is EMPLOYEE
    if (userType === "EMPLOYEE") {
      if (slots.length > 0) {
        // Convert slots to employee schedule format
        const converted = slotsToEmployeeFormat(slots);
        setEmployeeSchedule(converted);
      } else if (!userTypeChangedRef.current && mode === "CREATE") {
        // Reset to empty when no slots (only in create mode when user_type just changed)
        setEmployeeSchedule({
          regularDays: { am: null, pm: null },
          saturdays: { am: null, pm: null },
        });
      }
    }

    // Clear the userTypeChanged flag after processing
    if (userTypeChangedRef.current) {
      userTypeChangedRef.current = false;
    }
  }, [slots, userType, mode]);

  // Reset slots when user type changes (only in create mode, not edit mode)
  useEffect(() => {
    if (mode === "CREATE") {
      userTypeChangedRef.current = true;
      if (userType === "EMPLOYEE") {
        setEmployeeSchedule({
          regularDays: { am: null, pm: null },
          saturdays: { am: null, pm: null },
        });
      }
      setSlots([]);
    }
  }, [userType, mode]);

  // Handle employee schedule changes - convert to slots and update parent
  const handleEmployeeScheduleChange = (
    newSchedule: EmployeeScheduleFormat
  ) => {
    setEmployeeSchedule(newSchedule);
    // Mark that we're updating from employee schedule to prevent circular update
    isUpdatingFromEmployeeSchedule.current = true;
    // Convert to slots and update parent's slots state
    const convertedSlots = employeeFormatToSlots(newSchedule);
    // Convert to Slot format with temp IDs for create mode
    const slotsWithIds: Slot[] = convertedSlots.map((slot, index) => ({
      id: `temp_${Date.now()}_${index}`,
      schedule_id: "",
      ...slot,
    }));
    setSlots(slotsWithIds);
  };

  return (
    <div className={cn("flex flex-col gap-4 w-full z-50")}>
      <div className={cn("flex flex-col gap-4")}>
        <div className="flex flex-col gap-4">
          <div className="w-full flex flex-col md:flex-row gap-4">
            <TextBox
              title="Schedule Name (Required)"
              value={name}
              setValue={(value) =>
                setScheduleForm((prev) => ({ ...prev, name: value }))
              }
              disabled={isLoading}
              placeHolder="Enter schedule name"
              containerClassName="w-full"
            />

            <div className="flex flex-col justify-end">
              <div
                className={cn("text-base text-textBody flex flex-row gap-2")}
              >
                <p>User Type </p>
              </div>
              <Select
                value={userType}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    user_type: e.target.value as UserType,
                  }))
                }
                disabled={isLoading}
              >
                <option value="STUDENT">Student</option>
                <option value="EMPLOYEE">Employee</option>
              </Select>
            </div>
          </div>
          <ParagraphBox
            title="Description"
            value={description}
            setValue={(value) =>
              setScheduleForm((prev) => ({
                ...prev,
                description: value,
              }))
            }
            disabled={isLoading}
            placeholder="Enter schedule description"
          />
        </div>

        {userType === "EMPLOYEE" ? (
          <EmployeeScheduleForm
            schedule={employeeSchedule}
            disabled={isLoading}
            onChange={handleEmployeeScheduleChange}
          />
        ) : (
          <StudentScheduleForm
            slots={slots}
            setSlots={setSlots}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default ScheduleForm;
