"use client";

import React from "react";
import { cn } from "@/utils/style";
import { ExtendedUser } from "@/models";

interface IUserInfo {
  user: ExtendedUser;
}

const UserInfo = ({ user }: IUserInfo) => {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 text-textBody lg:max-w-md",
        "lg:overflow-y-auto",
        "px-6 pb-6"
      )}
    >
      {/* Personal Information */}
      <div>
        <p className="text-lg font-medium text-primary border-b border-primary pb-1">
          Personal Information
        </p>
        <table
          className={cn(
            "min-w-60 text-sm border-collapse lg:flex-1 rounded-sm lg:overflow-hidden"
          )}
        >
          <tbody>
            <tr className="h-10">
              <td className="px-4 font-medium">User ID</td>
              <td className="px-4">{user.id}</td>
            </tr>
            <tr className="h-10">
              <td className="px-4 font-medium">First Name</td>
              <td className="px-4">{user.first_name}</td>
            </tr>
            <tr className="h-10">
              <td className="px-4 font-medium">Middle Name</td>
              <td className="px-4">{user.middle_name || "-"}</td>
            </tr>
            <tr className="h-10">
              <td className="px-4 font-medium">Last Name</td>
              <td className="px-4">{user.last_name}</td>
            </tr>
            <tr className="h-10">
              <td className="px-4 font-medium">Sex</td>
              <td className="px-4">{user.sex}</td>
            </tr>
            <tr className="h-10">
              <td className="px-4 font-medium">Birth Date</td>
              <td className="px-4">
                {new Date(user.birth_date).toDateString()}
              </td>
            </tr>
            <tr className="h-10">
              <td className="px-4 font-medium">Address</td>
              <td className="px-4">{user.address}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Organizational Information */}
      <div>
        <p className="text-lg font-medium text-primary border-b border-primary pb-1">
          Organizational Information
        </p>
        <table
          className={cn(
            "min-w-60 text-sm border-collapse flex-1 rounded-sm overflow-hidden"
          )}
        >
          <tbody>
            {user.student ? (
              <>
                <tr className="h-10">
                  <td className="px-4 font-medium">Role</td>
                  <td className="px-4">STUDENT</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Student Number</td>
                  <td className="px-4">{user.id}</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Department</td>
                  <td className="px-4">{user.student.department}</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Program</td>
                  <td className="px-4">{user.student.program}</td>
                </tr>
              </>
            ) : user.employee ? (
              <>
                <tr className="h-10">
                  <td className="px-4 font-medium">Role</td>
                  <td className="px-4">EMPLOYEE</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Employee Number</td>
                  <td className="px-4">{user.id}</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Contact</td>
                  <td className="px-4">{user.employee.contact_number}</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Type</td>
                  <td className="px-4">{user.employee.type}</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Division</td>
                  <td className="px-4">{user.employee.division}</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Position</td>
                  <td className="px-4">{user.employee.title}</td>
                </tr>
              </>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Guardian Information */}
      {user.guardian && (
        <div>
          <p className="text-lg font-medium text-primary border-b border-primary pb-1">
            Guardian Information
          </p>
          <table className={cn(" text-sm border-collapse flex-1 rounded-sm")}>
            <tbody>
              <tr className="h-10">
                <td className="px-4 font-medium">First Name</td>
                <td className="px-4">{user.guardian.first_name}</td>
              </tr>
              <tr className="h-10">
                <td className="px-4 font-medium">Middle Name</td>
                <td className="px-4">{user.guardian.middle_name || "-"}</td>
              </tr>
              <tr className="h-10">
                <td className="px-4 font-medium">Last Name</td>
                <td className="px-4">{user.guardian.last_name}</td>
              </tr>
              <tr className="h-10">
                <td className="px-4 font-medium">Sex</td>
                <td className="px-4">{user.guardian.sex}</td>
              </tr>
              <tr className="h-10">
                <td className="px-4 font-medium">Contact</td>
                <td className="px-4">{user.guardian.contact_number}</td>
              </tr>
              <tr className="h-10">
                <td className="px-4 font-medium">Address</td>
                <td className="px-4">{user.guardian.address}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserInfo;
