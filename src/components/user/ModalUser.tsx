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
import { ArrowBigRight, X } from "lucide-react";
import * as userDB from "@/database/user";

import Status from "./Status";
import UserInfo from "./UserInfo";
import UserAttendance from "./UserAttendance";
import DropDown from "../DropDown";

interface IModalUser {
  onViewUser: User | null;
  onClose: (isRefresh?: boolean) => void;
}

const ModalUser = ({ onViewUser, onClose }: IModalUser) => {
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
            <DialogPanel className="w-full max-w-5xl rounded-xl bg-secondary py-6 shadow-xl flex flex-col gap-6 ">
              {/* Header */}
              <div className="flex justify-between items-center px-6">
                <DialogTitle className="text-xl font-semibold text-primary">
                  User Information
                </DialogTitle>
                <button
                  onClick={() => onClose()}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                </button>
              </div>

              <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto overflow-x-hidden px-6">
                <UserInfo user={user} isLoading={isLoading} onClose={onClose} />

                <DropDown
                  headerElement={
                    <p className="text-xl text-primary/80">Attendance Record</p>
                  }
                  isDefaultOpen
                >
                  <UserAttendance user={user} />
                </DropDown>
                <Status user={onViewUser} />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalUser;
