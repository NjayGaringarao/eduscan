"use client";

import React, { useEffect, useState } from "react";
import { Schedule, User } from "@/models";
import UserTable from "../user/UserTable";
import StudentTable from "../user/StudentTable";
import EmployeeTable from "../user/EmployeeTable";
import Loading from "../Loading";
import TableHolder from "../container/TableHolder";
import Box from "../container/Box";
import Button from "../Button";
import TextBox from "../TextBox";
import { UserPlus } from "lucide-react";
import { cn } from "@/utils/style";
import * as unlinkUsersLib from "@/lib/schedule/unlinkUsers";

interface IUserList {
  schedule: Schedule & { users: User[] };
  onRefresh?: () => void;
}

const UserList = ({ schedule, onRefresh }: IUserList) => {
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<User[]>([]);

  // Filter states for conditional tables - following UserManagement pattern
  const [studentFilter, setStudentFilter] = useState({
    department: "ALL",
    program: "ALL",
  });

  const [employeeFilter, setEmployeeFilter] = useState({
    type: "ALL",
    division: "ALL",
    title: "ALL",
  });

  const fetchUserList = async () => {
    if (!schedule?.users || !Array.isArray(schedule.users)) {
      setUserList([]);
      setSelected([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // Use the schedule.users data directly - following UserManagement pattern
    setUserList(schedule.users as User[]);
    setSelected([]);
    setIsLoading(false);
  };

  const handleUnlink = async () => {
    if (
      !confirm(
        `Confirm Unlink: Are you sure you want to unlink ${selected.length} selected user(s) from this schedule?`
      )
    )
      return;

    try {
      const userIds = selected.map((user) => user.user_id);
      const { error } = await unlinkUsersLib.unlinkUsersFromSchedule(
        schedule.schedule_id,
        userIds
      );

      if (error) {
        alert(`Error unlinking users: ${error}`);
        return;
      }

      alert(
        `✅ Successfully unlinked ${selected.length} user(s) from schedule!`
      );
      setSelected([]);

      // Refresh the schedule data
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      alert("Failed to unlink users");
      console.error("Error unlinking users:", err);
    }
  };

  const handleAddUser = () => {
    // TODO: Implement add user to schedule functionality
    alert("Add User functionality will be implemented");
  };

  // Follow UserManagement pattern - only fetch when schedule changes
  useEffect(() => {
    fetchUserList();
  }, [schedule]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loading prompt="Loading users..." />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 w-full lg:col-span-2">
      <Box
        containerClassName={cn(
          "relative overflow-hidden overflow-y-auto w-full h-full min-h-20",
          "flex flex-col gap-4"
        )}
      >
        {/* Data Controller */}
        <div className="flex flex-row gap-4 w-full justify-between items-center">
          <TextBox
            value={searchQuery}
            setValue={setSearchQuery}
            placeHolder={"Search associated user..."}
            containerClassName="w-full"
          />

          <Button
            className="w-48 h-full md:h-auto"
            secondary
            onClick={handleAddUser}
          >
            <UserPlus className="text-primary" /> Add User
          </Button>
        </div>

        {/* Table View - Following UserManagement exact pattern */}
        <TableHolder className="h-full">
          {schedule.user_type === "STUDENT" ? (
            <StudentTable
              userList={userList}
              query={searchQuery}
              onSelectionChange={setSelected}
              filter={studentFilter}
            />
          ) : schedule.user_type === "EMPLOYEE" ? (
            <EmployeeTable
              userList={userList}
              query={searchQuery}
              onSelectionChange={setSelected}
              filter={employeeFilter}
            />
          ) : (
            <UserTable
              userList={userList}
              query={searchQuery}
              onSelectionChange={setSelected}
            />
          )}
        </TableHolder>

        {selected.length > 0 && (
          <Box containerClassName="place-self-end bg-background p-4 w-full flex justify-between items-center">
            <p className="text-base text-uGrayLight">
              {selected.length} selected
            </p>
            <Button
              title="Unlink Selected"
              className="bg-warning"
              onClick={handleUnlink}
            />
          </Box>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col justify-center items-center gap-4 z-50">
            <Loading prompt="Please wait..." />
          </div>
        )}
      </Box>
    </div>
  );
};

export default UserList;
