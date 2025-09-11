"use client";

import React from "react";
import DropDown from "../DropDown";
import Loading from "../Loading";
import { cn } from "@/utils/style";
import { ArrowBigRight } from "lucide-react";
import { ExtendedUser } from "@/models";
import Button from "../Button";
import * as userDB from "@/database/user";
import { useRouter } from "next/navigation";

interface IUserInfo {
  user: ExtendedUser;
  isLoading?: boolean;
  onClose: (isRefresh?: boolean) => void;
}

const UserInfo = ({ user, isLoading, onClose }: IUserInfo) => {
  const router = useRouter();
  const handleDeleteUser = async () => {
    if (
      !confirm(
        "Confirm Delete: Are you sure you want to delete this user? This action cannot be undone."
      ) ||
      !user
    ) {
      return;
    }

    const { error } = await userDB.deleteUsers([user]);
    if (error) {
      alert(error);
    } else {
      onClose(true);
    }
  };

  return (
    <div className="border-y border-textBody/60 gap-6 py-6">
      <h3 className="text-2xl font-semibold text-primary">
        {`${user.first_name} ${user.middle_name ? user.middle_name + " " : ""}${
          user.last_name
        }`}
      </h3>

      <DropDown
        containerClassName="mt-1"
        headerElement={
          <>
            {user.student ? (
              <div className="text-sm text-background flex flex-row gap-2">
                <p className="bg-primary/80 rounded-sm px-2">STUDENT</p>
                <ArrowBigRight className="text-textBody" />
                <p className="bg-textBody/80 rounded-sm px-2">
                  {user.student.department}
                </p>
                <p className="bg-textBody/80 rounded-sm px-2">
                  {user.student.program}
                </p>
              </div>
            ) : user.employee ? (
              <div className="text-sm text-background flex flex-row gap-2">
                <p className="bg-primary/80 rounded-sm px-2">EMPLOYEE</p>
                <ArrowBigRight className="text-textBody" />
                <p className="bg-textBody/80 rounded-sm px-2">
                  {user.employee.division}
                </p>
                <p className="bg-textBody/80 rounded-sm px-2">
                  {user.employee.title}
                </p>
              </div>
            ) : null}
          </>
        }
      >
        <div className="relative flex flex-row gap-4 overflow-y-auto p-1 text-textBody">
          {/* Personal Info */}
          <table
            className={cn(
              "min-w-60 text-sm border-collapse flex-1 rounded-sm overflow-hidden",
              "shadow-md shadow-primary/50"
            )}
          >
            <thead>
              <tr>
                <th
                  colSpan={2}
                  className="bg-primary/10 px-3 py-2 text-left font-medium text-primary"
                >
                  Personal Information
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-1 font-semibold">First Name</td>
                <td className="px-3 py-1">{user.first_name}</td>
              </tr>
              <tr>
                <td className="px-3 py-1 font-semibold">Middle Name</td>
                <td className="px-3 py-1">{user.middle_name || "-"}</td>
              </tr>
              <tr>
                <td className="px-3 py-1 font-semibold">Last Name</td>
                <td className="px-3 py-1">{user.last_name}</td>
              </tr>
              <tr>
                <td className="px-3 py-1 font-semibold">Sex</td>
                <td className="px-3 py-1">{user.sex}</td>
              </tr>
              <tr>
                <td className="px-3 py-1 font-semibold">Birth Date</td>
                <td className="px-3 py-1">
                  {new Date(user.birth_date).toDateString()}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-1 font-semibold">Address</td>
                <td className="px-3 py-1">{user.address}</td>
              </tr>
            </tbody>
          </table>

          {/* Organizational Info */}
          <table
            className={cn(
              "min-w-60 text-sm border-collapse flex-1 rounded-sm overflow-hidden",
              "shadow-md shadow-primary/50"
            )}
          >
            <thead>
              <tr>
                <th
                  colSpan={2}
                  className="bg-primary/10 px-3 py-2 text-left font-medium text-primary"
                >
                  Organizational Information
                </th>
              </tr>
            </thead>
            <tbody>
              {user.student ? (
                <>
                  <tr>
                    <td className="px-3 py-1 font-semibold">Role</td>
                    <td className="px-3 py-1">STUDENT</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-semibold">Student Number</td>
                    <td className="px-3 py-1">{user.user_id}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-semibold">Department</td>
                    <td className="px-3 py-1">{user.student.department}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-semibold">Program</td>
                    <td className="px-3 py-1">{user.student.program}</td>
                  </tr>
                </>
              ) : user.employee ? (
                <>
                  <tr>
                    <td className="px-3 py-1 font-semibold">Role</td>
                    <td className="px-3 py-1">EMPLOYEE</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-semibold">Employee Number</td>
                    <td className="px-3 py-1">{user.user_id}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-semibold">Contact</td>
                    <td className="px-3 py-1">
                      {user.employee.contact_number}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-semibold">Type</td>
                    <td className="px-3 py-1">{user.employee.type}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-semibold">Division</td>
                    <td className="px-3 py-1">{user.employee.division}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-semibold">Position</td>
                    <td className="px-3 py-1">{user.employee.title}</td>
                  </tr>
                </>
              ) : null}
            </tbody>
          </table>

          {/* Guardian Info */}
          {user.guardian && (
            <table
              className={cn(
                "min-w-60 text-sm border-collapse flex-1 rounded-sm overflow-hidden",
                "shadow-md shadow-primary/50"
              )}
            >
              <thead>
                <tr>
                  <th
                    colSpan={2}
                    className="bg-primary/10 px-3 py-2 text-left font-medium text-primary"
                  >
                    Guardian Information
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-1 font-semibold">First Name</td>
                  <td className="px-3 py-1">{user.guardian.first_name}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1 font-semibold">Middle Name</td>
                  <td className="px-3 py-1">
                    {user.guardian.middle_name || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-1 font-semibold">Last Name</td>
                  <td className="px-3 py-1">{user.guardian.last_name}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1 font-semibold">Sex</td>
                  <td className="px-3 py-1">{user.guardian.sex}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1 font-semibold">Contact</td>
                  <td className="px-3 py-1">{user.guardian.contact_number}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1 font-semibold">Address</td>
                  <td className="px-3 py-1">{user.guardian.address}</td>
                </tr>
              </tbody>
            </table>
          )}
          {isLoading && (
            <div
              className={cn(
                "absolute z-30 h-full w-full rounded-lg",
                "bg-background/10 backdrop-blur-xs",
                "flex flex-col items-center justify-center"
              )}
            >
              <Loading prompt="Please wait..." />
            </div>
          )}
        </div>
        <div className="flex flex-row gap-2 w-full justify-end mt-4">
          <Button
            title="Edit"
            className="w-24"
            onClick={() => {
              router.push(`/form/user/edit/${user.user_id}`);
            }}
            secondary
          />
          <Button
            title="Delete"
            className="w-24 border-uRed text-uRed"
            onClick={handleDeleteUser}
            secondary
          />
        </div>
      </DropDown>
    </div>
  );
};

export default UserInfo;
