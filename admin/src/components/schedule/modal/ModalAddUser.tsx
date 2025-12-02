"use client";

import { useEffect, useState } from "react";
import { Schedule, User } from "@/models";
import * as scheduleLib from "@/lib/schedule";
import UserTable from "../../user/UserTable";
import StudentTable from "../../user/StudentTable";
import EmployeeTable from "../../user/EmployeeTable";
import Loading from "../../Loading";
import TableHolder from "../../container/TableHolder";
import Box from "../../container/Box";
import Button from "../../Button";
import TextBox from "../../TextBox";
import { cn } from "@/utils/style";
import BaseModal from "../../container/BaseModal";

interface ModalAddUserProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  onRefresh: () => void;
}

const ModalAddUser = ({
  isOpen,
  onClose,
  schedule,
  onRefresh,
}: ModalAddUserProps) => {
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<User[]>([]);

  // Filter states for conditional tables
  // But this time we set it to default values to show all users
  // It should be useState variable for dynamic filtering, but we do not require such complexity here.
  const studentFilter = {
    department: "ALL",
    program: "ALL",
  };

  const employeeFilter = {
    type: "ALL",
    division: "ALL",
    title: "ALL",
  };

  const fetchAvailableUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch available users (users with no schedule), filtered by user type
      const { users, error } = await scheduleLib.getAvailableUsers(
        schedule.user_type
      );

      if (error) {
        alert(`Error fetching available users: ${error}`);
        setIsLoading(false);
        return;
      }

      setUserList(users || []);
      setSelected([]);
    } catch (err) {
      console.error("Error fetching available users:", err);
      alert("Failed to fetch available users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUsers = async () => {
    if (selected.length === 0) {
      alert("Please select at least one user to add.");
      return;
    }

    setIsAdding(true);
    try {
      // Link all selected users to this schedule in one operation
      const userIds = selected.map((user) => user.id);
      const { error } = await scheduleLib.linkUsersToSchedule(
        userIds,
        schedule.id
      );

      if (error) {
        alert(`Failed to add users: ${error}`);
        return;
      }

      setSelected([]);

      // Refresh the parent component and close modal
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Error adding users:", err);
      alert("Failed to add users to schedule");
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSelected([]);
    setSearchQuery("");
    onClose();
  };

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
    }
  }, [isOpen, schedule]);

  const footer = (
    <div className="flex justify-between items-center py-4 px-6">
      <p className="text-sm text-primary/70">
        {selected.length} user{selected.length !== 1 ? "s" : ""} selected
      </p>
      <div className="flex gap-2">
        <Button
          onClick={handleAddUsers}
          disabled={selected.length === 0 || isAdding}
          className="w-32"
        >
          Add
        </Button>
        <Button onClick={handleClose} secondary className="w-32">
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add Users to ${schedule.name}`}
      panelClassName="w-full max-w-6xl h-full max-h-[80vh]"
      contentClassName="flex flex-col gap-4 p-6 h-full"
      footer={footer}
    >
      {/* Search Bar */}
      <div className="flex flex-row gap-4 w-full justify-between items-center">
        <TextBox
          value={searchQuery}
          setValue={setSearchQuery}
          placeHolder={`Search available ${schedule.user_type.toLowerCase()}s...`}
          containerClassName="w-full"
        />
      </div>

      {/* Table View - Following UserManagement exact pattern */}
      <Box
        containerClassName={cn("relative w-full", "flex-1 flex flex-col gap-4")}
      >
        <TableHolder className="h-full">
          {schedule.user_type === "STUDENT" ? (
            <StudentTable
              userList={userList}
              query={searchQuery}
              onSelectionChange={setSelected}
              filter={studentFilter}
              isSelectionOnly={true}
            />
          ) : schedule.user_type === "EMPLOYEE" ? (
            <EmployeeTable
              userList={userList}
              query={searchQuery}
              onSelectionChange={setSelected}
              filter={employeeFilter}
              isSelectionOnly={true}
            />
          ) : (
            <UserTable
              userList={userList}
              query={searchQuery}
              onSelectionChange={setSelected}
              isSelectionOnly={true}
            />
          )}
        </TableHolder>

        {isLoading && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col justify-center items-center gap-4 z-50">
            <Loading prompt="Loading available users..." />
          </div>
        )}
      </Box>
    </BaseModal>
  );
};

export default ModalAddUser;
