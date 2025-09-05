"use client";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { ExtendedUser, User } from "@/models";
import { ArrowBigRight, MapPinPlusInside, X } from "lucide-react";
import * as userDB from "@/database/user";
import DropDown from "../DropDown";
import { cn } from "@/utils/style";
import Button from "../Button";
import { useRouter } from "next/navigation";

interface IModalUser {
  onViewUser: User | null;
  onClose: () => void;
}

const ModalUser = ({ onViewUser, onClose }: IModalUser) => {
  const router = useRouter();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const open = !!user;

  const fetchUserHandle = async () => {
    setIsLoading(true);
    const { user, error } = await userDB.get(onViewUser?.user_id!);
    if (error) alert(error);

    setUser(user);
    setIsLoading(false);
  };

  useEffect(() => {
    if (onViewUser) {
      fetchUserHandle();
    } else {
      setUser(null);
    }
  }, [onViewUser]);

  if (!user) return null;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
        </TransitionChild>

        {/* Centered panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-5xl rounded-xl bg-white p-6 shadow-xl flex flex-col gap-6  ">
              {/* Header */}
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl font-semibold text-primary">
                  User Information
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                </button>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1 py-6 border-y primary/80">
                <h3 className="text-2xl font-semibold text-primary">
                  {`${user.first_name} ${
                    user.middle_name ? user.middle_name + " " : ""
                  }${user.last_name}`}
                </h3>

                <DropDown
                  headerElement={
                    <>
                      {user.student ? (
                        <div className="text-sm text-background flex flex-row gap-2">
                          <p className="bg-primary/80 rounded-sm px-2">
                            STUDENT
                          </p>
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
                          <p className="bg-primary/80 rounded-sm px-2">
                            EMPLOYEE
                          </p>
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                          <td className="px-3 py-1 font-semibold">
                            First Name
                          </td>
                          <td className="px-3 py-1">{user.first_name}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-1 font-semibold">
                            Middle Name
                          </td>
                          <td className="px-3 py-1">
                            {user.middle_name || "-"}
                          </td>
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
                          <td className="px-3 py-1 font-semibold">
                            Birth Date
                          </td>
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
                              <td className="px-3 py-1">Student</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1 font-semibold">
                                Student Number
                              </td>
                              <td className="px-3 py-1">{user.user_id}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1 font-semibold">
                                Department
                              </td>
                              <td className="px-3 py-1">
                                {user.student.department}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1 font-semibold">
                                Program
                              </td>
                              <td className="px-3 py-1">
                                {user.student.program}
                              </td>
                            </tr>
                          </>
                        ) : user.employee ? (
                          <>
                            <tr>
                              <td className="px-3 py-1 font-semibold">Role</td>
                              <td className="px-3 py-1">Employee</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1 font-semibold">
                                Employee Number
                              </td>
                              <td className="px-3 py-1">{user.user_id}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1 font-semibold">
                                Contact
                              </td>
                              <td className="px-3 py-1">
                                {user.employee.contact_number}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1 font-semibold">Type</td>
                              <td className="px-3 py-1">
                                {user.employee.type}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1 font-semibold">
                                Division
                              </td>
                              <td className="px-3 py-1">
                                {user.employee.division}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1 font-semibold">
                                Position
                              </td>
                              <td className="px-3 py-1">
                                {user.employee.title}
                              </td>
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
                            <td className="px-3 py-1 font-semibold">
                              First Name
                            </td>
                            <td className="px-3 py-1">
                              {user.guardian.first_name}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 font-semibold">
                              Middle Name
                            </td>
                            <td className="px-3 py-1">
                              {user.guardian.middle_name || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 font-semibold">
                              Last Name
                            </td>
                            <td className="px-3 py-1">
                              {user.guardian.last_name}
                            </td>
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
                            <td className="px-3 py-1">
                              {user.guardian.address}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </DropDown>
              </div>

              <div className="flex flex-row gap-4 items-center w-full">
                <div className="flex-1 flex flex-row gap-4 items-center">
                  <p className={cn("text-primary/80")}>CURRENT LOCATION</p>
                  <div
                    className={cn(
                      "p-2 w-48 rounded-lg",
                      "border border-textBody",
                      "flex flex-row items-center justify-center gap-1",
                      "text-primary/80"
                    )}
                  >
                    <MapPinPlusInside />
                    <p className={cn("font-semibold")}>INSIDE</p>
                  </div>
                </div>
                <Button
                  title="Edit"
                  className="w-24"
                  onClick={() => {
                    router.push(`/user/edit/${user.user_id}`);
                  }}
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalUser;
