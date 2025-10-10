"use client";

import React from "react";
import { User } from "@/models";
import StudentAttendance from "./StudentAttendance";
import EmployeeAttendance from "./EmployeeAttendance";

interface IUserAttendanceProps {
  user: User;
}

const UserAttendance = ({ user }: IUserAttendanceProps) => {
  // Route to appropriate attendance view based on user type
  if (user.employee) {
    return <EmployeeAttendance user={user} />;
  }

  // Default to student attendance view
  return <StudentAttendance user={user} />;
};

export default UserAttendance;
