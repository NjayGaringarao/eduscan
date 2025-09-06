import PageHeader from "@/components/PageHeader";
import CreateUser from "@/components/user/CreateUser";
import { cn } from "@/utils/style";

import React from "react";

const createUserPage = () => {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        "h-full w-full max-w-7xl pt-4 md:p-6"
      )}
    >
      <PageHeader title="Create User" allowBack />

      {/* Form component here */}
      <div className="flex-1 overflow-hidden">
        <CreateUser />
      </div>
    </div>
  );
};

export default createUserPage;
