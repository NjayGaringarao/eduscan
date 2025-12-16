"use client";

import React from "react";
import BaseModal from "../container/BaseModal";
import CreateUser from "./CreateUser";

interface IModalRegisterUser {
  isOpen: boolean;
  onClose: (isRefresh?: boolean) => void;
}

const ModalRegisterUser = ({ isOpen, onClose }: IModalRegisterUser) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => onClose(false)}
      title="Register User"
      panelClassName="w-full max-w-5xl"
    >
      <CreateUser
        onCreated={() => {
          // close modal and ask parent to refresh
          onClose(true);
        }}
      />
    </BaseModal>
  );
};

export default ModalRegisterUser;
