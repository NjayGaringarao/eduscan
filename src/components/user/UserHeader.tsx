"use client";

import * as userDB from "@/database/user";
import React from "react";
import Button from "../Button";
import { Edit, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { User } from "@/models";

interface IUserHeader {
  user: User | null;
  onClose: (isRefresh?: boolean) => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserHeader = ({ user, onClose, setIsLoading }: IUserHeader) => {
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

    setIsLoading(true);
    const { error } = await userDB.deleteUsers([user]);
    if (error) {
      alert(error);
    } else {
      onClose(true);
    }
    setIsLoading(false);
  };
  return (
    <div className="sticky top-0 z-10 flex flex-row justify-between items-center w-full bg-background py-6 border-b border-textBody/20 px-6">
      <h3 className="text-2xl font-semibold text-primary">
        {`${user?.first_name} ${
          user?.middle_name ? user?.middle_name + " " : ""
        }${user?.last_name}`}
      </h3>
      <div className="flex flex-row gap-2">
        <Button
          onClick={() => {
            router.push(`/user/edit/${user?.id}`);
          }}
          secondary
        >
          <Edit className="h-6 w-6" />
        </Button>
        <Button
          className="border-uRed text-uRed"
          onClick={handleDeleteUser}
          secondary
        >
          <Trash className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default UserHeader;
