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

import DropDown from "../DropDown";
import { cn } from "@/utils/style";
import Button from "../Button";
import { useRouter } from "next/navigation";
import Loading from "../Loading";
import Status from "./Status";
import UserInfo from "./UserInfo";
import UserAttendance from "./UserAttendance";

interface IModalUser {
  onViewUser: User | null;
  onClose: (isRefresh?: boolean) => void;
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

  const handleDeleteUser = async () => {
    if (
      !confirm(
        "Confirm Delete: Are you sure you want to delete this user? This action cannot be undone."
      ) ||
      !onViewUser
    ) {
      return;
    }

    const { error } = await userDB.deleteUsers([onViewUser]);
    if (error) {
      alert(error);
    } else {
      onClose(true);
    }
  };

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
            <DialogPanel className="w-full max-w-5xl rounded-xl bg-secondary p-6 shadow-xl flex flex-col gap-6  ">
              {/* Header */}
              <div className="flex justify-between items-center">
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

              {/* Content */}
              <div className="flex flex-col gap-4 py-6 border-y border-primary/80">
                <h3 className="text-2xl font-semibold text-primary -mb-3">
                  {`${user.first_name} ${
                    user.middle_name ? user.middle_name + " " : ""
                  }${user.last_name}`}
                </h3>

                <UserInfo user={user} isLoading={isLoading} />
              </div>
              <UserAttendance user_id={user.user_id} />

              <div className="flex flex-row gap-4 items-center w-full">
                <Status user={onViewUser} />
                <div className="flex flex-row gap-4">
                  <Button
                    title="Edit"
                    className="w-24 p-2"
                    onClick={() => {
                      router.push(`/form/user/edit/${user.user_id}`);
                    }}
                    secondary
                  />
                  <Button
                    title="Delete"
                    className="w-24 border-uRed text-uRed p-2"
                    onClick={handleDeleteUser}
                    secondary
                  />
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalUser;
