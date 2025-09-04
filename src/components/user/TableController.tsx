"use client";

import { useEffect, useState } from "react";
import { User } from "@/models"; // assuming you have this defined
import * as userDB from "@/database/user";
import UserTable from "./UserTable";
import { cn } from "@/utils/style";
import TextBox from "../TextBox";
import Button from "../Button";
import Select from "../Select";
import Loading from "../Loading";
import { RefreshCcw } from "lucide-react";
import StudentTable from "./StudentTable";
import EmployeeTable from "./EmployeeTable";

const TableController = () => {
  const [userType, setUserType] = useState("ALL");
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<User[]>([]);
  const [onEditUser, setOnEditUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUserList = async (userType?: string) => {
    setIsLoading(true);
    const { users, error } = await userDB.getAll(userType);
    if (error) alert(error);

    setUserList(users || []);
    setSelected([]);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Confirm Delete: Are you sure you want to delete this user?"))
      return;

    await userDB.deleteUsers(selected);
    await fetchUserList();
  };

  useEffect(() => {
    fetchUserList(userType);
  }, [userType]);

  return (
    <div className="relative h-full w-full">
      <div
        className={cn(
          "relative max-w-full h-full rounded-xl p-6",
          "bg-background/70 backdrop-blur-lg border border-primary/20",
          "flex flex-col items-start gap-4"
        )}
      >
        <div className="flex flex-row gap-4 w-full justify-between">
          <div className="flex flex-row gap-4 w-full">
            <TextBox
              value={searchQuery}
              setValue={setSearchQuery}
              placeHolder={"Search user..."}
              containerClassName="w-1/3"
            />
            <Select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="min-w-32 w-32"
              title="Filter by type"
            >
              <option value="ALL">ALL USER</option>
              <option value="STUDENT">STUDENT</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </Select>
            <Button secondary onClick={fetchUserList} disabled={isLoading}>
              <RefreshCcw
                className={cn(
                  "w-5 h-5 text-primary",
                  isLoading && "animate-spin"
                )}
              />
            </Button>
          </div>
          <Button title="Add User" className="w-36" />
        </div>

        <div
          className={cn(
            "relative overflow-hidden h-full",
            "flex flex-col items-start gap-4"
          )}
        >
          {userType === "STUDENT" ? (
            <StudentTable
              userList={userList}
              query={searchQuery}
              onRowClick={(u) => setOnEditUser(u)}
              onSelectionChange={setSelected}
            />
          ) : userType === "EMPLOYEE" ? (
            <EmployeeTable
              userList={userList}
              query={searchQuery}
              onRowClick={(u) => setOnEditUser(u)}
              onSelectionChange={setSelected}
            />
          ) : (
            <UserTable
              userList={userList}
              query={searchQuery}
              onRowClick={(u) => setOnEditUser(u)}
              onSelectionChange={setSelected}
            />
          )}
          {selected.length > 0 && (
            <div className="place-self-end bg-background p-4 w-full flex justify-between items-center shadow-md z-50 rounded-md border border-primary">
              <p className="text-base text-uGrayLight">
                {selected.length} selected
              </p>
              <Button
                title="Delete Selected"
                className="bg-error"
                onClick={handleDelete}
              />
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col justify-center items-center gap-4 z-50">
              <Loading prompt="Please wait..." />
            </div>
          )}
        </div>
      </div>

      {/* <ModalEditUser
        onEditUser={onEditUser}
        setOnEditUser={setOnEditUser}
        refreshHandler={fetchUserList}
      /> */}
    </div>
  );
};

export default TableController;
