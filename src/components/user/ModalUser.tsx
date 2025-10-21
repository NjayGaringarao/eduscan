"use client";

import { useEffect, useState } from "react";
import { ExtendedUser, User } from "@/models";
import * as userDB from "@/database/user";

import UserPerformance from "./UserPerformance";
import UserInfo from "./UserInfo";
import UserAttendance from "./UserAttendance";
import BaseModal from "../container/BaseModal";
import UserHeader from "./UserHeader";
import UserSchedule from "./UserSchedule";

interface IModalUser {
  onViewUser: User | null;
  onClose: (isRefresh?: boolean) => void;
}

const ModalUser = ({ onViewUser, onClose }: IModalUser) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserHandle = async () => {
    setIsLoading(true);
    const { user: _user, error } = await userDB.get(onViewUser?.user_id!);
    if (error) alert(error);

    setUser(_user);
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
    <BaseModal
      isOpen={!!onViewUser}
      onClose={onClose}
      title={"User"}
      panelClassName="max-w-7xl"
    >
      <div className="flex flex-col gap-6 overflow-y-auto overflow-x-hidden p-6">
        <UserHeader user={onViewUser} onClose={onClose} />

        <UserInfo user={user} isLoading={isLoading} />

        <UserSchedule user={user} refreshUser={fetchUserHandle} />

        <UserAttendance user={user} />

        <UserPerformance user={onViewUser} />
      </div>
    </BaseModal>
  );
};

export default ModalUser;
