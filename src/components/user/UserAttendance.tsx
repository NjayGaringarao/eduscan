"use client";

import React from "react";
import { User } from "@/models";
import StudentAttendance from "./StudentAttendance";
import EmployeeAttendance from "./EmployeeAttendance";
import DropDown from "../container/DropDown";

interface IUserAttendanceProps {
  user: User;
}

const UserAttendance = ({ user }: IUserAttendanceProps) => {
  return (
    <DropDown
      headerElement={
        <p className="text-lg text-primary/80">
          {user.employee ? "Daily Time Record" : "Attendance Record"}
        </p>
      }
      childClassName="relative"
    >
      {user.employee ? (
        <EmployeeAttendance user={user} />
      ) : (
        <StudentAttendance user={user} />
      )}
    </DropDown>
  );
};

export default UserAttendance;
