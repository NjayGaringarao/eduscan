"use client";

import React from "react";
import BaseModal from "../container/BaseModal";
import EditUser from "./EditUser";

interface IModalModifyUser {
  isOpen: boolean;
  userId: string | undefined;
  onClose: (isRefresh?: boolean) => void;
  onUpdated?: () => void; // optional callback for parent to refresh data
}

const ModalModifyUser = ({
  isOpen,
  userId,
  onClose,
  onUpdated,
}: IModalModifyUser) => {
  if (!userId) return null;

  return (
    <BaseModal
      panelClassName="w-full max-w-5xl"
      isOpen={isOpen}
      onClose={() => onClose(false)}
      title="Modify User"
    >
      <EditUser
        userId={userId}
        onUpdated={() => {
          // close the edit modal and inform parent that an update happened
          onUpdated?.();
          onClose(true);
        }}
      />
    </BaseModal>
  );
};

export default ModalModifyUser;
