"use client";

import { useEffect, useState } from "react";
import { ExtendedUser, User } from "@/models";
import { get as getUser } from "@/lib/user";
import UserInfo from "./UserInfo";
import UserAttendance from "./UserAttendance";
import BaseModal from "../container/BaseModal";
import UserHeader from "./UserHeader";
import UserSchedule from "./UserSchedule";
import Loading from "../Loading";
import { cn } from "@/utils/style";
import ModalModifyUser from "./ModalModifyUser";

interface IModalUser {
  onViewUser: User | null;
  onClose: (isRefresh?: boolean) => void;
  onRefresh?: () => void; // callback to ask parent to refresh user list without closing this modal
}

const ModalUser = ({ onViewUser, onClose, onRefresh }: IModalUser) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchUserHandle = async () => {
    setIsLoading(true);
    const { user: _user, error } = await getUser(onViewUser?.id!);
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
      panelClassName="flex flex-col max-w-7xl h-[85vh]"
    >
      <div className="relative flex flex-col overflow-hidden pt-0">
        <UserHeader
          user={onViewUser}
          onClose={onClose}
          setIsLoading={setIsLoading}
          onEdit={() => setShowEditModal(true)}
        />

        <ModalModifyUser
          isOpen={showEditModal}
          userId={onViewUser?.id}
          onClose={(isRefresh?: boolean) => {
            setShowEditModal(false);
            if (isRefresh) {
              fetchUserHandle();
              onRefresh?.();
            }
          }}
          onUpdated={() => {
            // refresh local user view and notify parent table
            fetchUserHandle();
            onRefresh?.();
          }}
        />
        <div className="flex flex-col lg:flex-row lg:flex-1 overflow-y-auto">
          <UserInfo user={user} />

          <div className="flex flex-col gap-6 lg:flex-1 lg:overflow-y-auto h-full px-6 py-4">
            <UserAttendance user={user} />

            {user.employee ? (
              <UserSchedule user={user} refreshUser={fetchUserHandle} />
            ) : null}
          </div>
        </div>

        {isLoading && (
          <div
            className={cn(
              "absolute z-30 h-full w-full rounded-lg",
              "bg-background/10 backdrop-blur-sm",
              "flex flex-col items-center justify-center"
            )}
          >
            <Loading prompt="Please wait..." />
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ModalUser;
