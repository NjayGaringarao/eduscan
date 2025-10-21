"use client";

import React from "react";
import DropDown from "../container/DropDown";
import { cn } from "@/utils/style";
import { ExtendedUser } from "@/models";

interface IUserInfo {
  user: ExtendedUser;
}

const UserInfo = ({ user }: IUserInfo) => {
  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        <DropDown
          containerClassName="mt-1"
          headerElement={
            <p className="text-lg text-primary/80">User Information</p>
          }
          isDefaultOpen
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
                      <td className="px-3 py-1 font-semibold">
                        Student Number
                      </td>
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
                      <td className="px-3 py-1 font-semibold">
                        Employee Number
                      </td>
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
                    <td className="px-3 py-1">
                      {user.guardian.contact_number}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 font-semibold">Address</td>
                    <td className="px-3 py-1">{user.guardian.address}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </DropDown>
      </div>
    </>
  );
};

export default UserInfo;
