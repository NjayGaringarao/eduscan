"use client";

import React, { useEffect, useState } from "react";
import { Schedule, User } from "@/models";
import EmployeeTable from "../user/EmployeeTable";
import Loading from "../Loading";
import TableHolder from "../container/TableHolder";
import Box from "../container/Box";
import Button from "../Button";
import TextBox from "../TextBox";
import { UserPlus } from "lucide-react";
import { cn } from "@/utils/style";
import * as scheduleLib from "@/lib/schedule";
import ModalAddUser from "./modal/ModalAddUser";

interface IUserList {
  schedule: Schedule & { users: User[] };
  onRefresh?: () => void;
}

const UserList = ({ schedule, onRefresh }: IUserList) => {
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<User[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const fetchUserList = async () => {
    if (!schedule?.users || !Array.isArray(schedule.users)) {
      setUserList([]);
      setSelected([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // Use the schedule.users data directly - following UserManagement pattern
    // Remove duplicates by user.id to prevent multiple entries
    const allUsers = schedule.users as User[];
    const uniqueUsers = allUsers.filter(
      (user, index, self) => index === self.findIndex((u) => u.id === user.id)
    );

    // Debug log to help identify the issue
    if (allUsers.length !== uniqueUsers.length) {
      console.warn(
        `UserList: Found ${
          allUsers.length - uniqueUsers.length
        } duplicate users in schedule ${schedule.id}`
      );
    }

    setUserList(uniqueUsers);
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
      const userIds = selected.map((user) => user.id);
      const { error } = await scheduleLib.unlinkUsersFromSchedule(
        schedule.id,
        userIds
      );

      if (error) {
        alert(`Error unlinking users: ${error}`);
        return;
      }

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
    setIsAddUserModalOpen(true);
  };

  // Follow UserManagement pattern - only fetch when schedule changes
  useEffect(() => {
    fetchUserList();
  }, [schedule?.id, schedule?.users]); // More specific dependencies

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
          "relative overflow-hidden overflow-y-auto w-full h-full p-0 border-none rounded-none",
          "flex flex-col gap-4 overflow-visible"
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

          <Button className="w-48 h-full" secondary onClick={handleAddUser}>
            <UserPlus className="text-primary" /> Add User
          </Button>
        </div>

        {/* Table View - Following UserManagement exact pattern */}
        <TableHolder className="h-full">
          {/* Schedule now generic: show unified user table for selection */}
          <EmployeeTable
            userList={userList}
            query={searchQuery}
            onSelectionChange={setSelected}
            isSelectionOnly={true}
          />
        </TableHolder>

        {selected.length > 0 && (
          <Box containerClassName="place-self-end bg-background p-4 w-full flex justify-between items-center">
            <p className="text-base text-uGrayLight">
              {selected.length} selected
            </p>
            <Button
              title="Unlink Selected"
              secondary
              onClick={handleUnlink}
              className="text-uRed border-uRed"
            />
          </Box>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col justify-center items-center gap-4 z-50">
            <Loading prompt="Please wait..." />
          </div>
        )}
      </Box>

      {/* Add User Modal */}
      <ModalAddUser
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        schedule={schedule}
        onRefresh={() => {
          // Refresh the parent schedule data (which will update the schedule prop)
          if (onRefresh) {
            onRefresh();
          }
        }}
      />
    </div>
  );
};

export default UserList;
