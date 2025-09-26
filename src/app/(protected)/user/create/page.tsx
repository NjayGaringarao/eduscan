import Backdrop from "@/components/container/Backdrop";
import PageBox from "@/components/container/PageBox";
import PageHeader from "@/components/PageHeader";
import CreateUser from "@/components/user/CreateUser";
import { cn } from "@/utils/style";

import React from "react";

const createUserPage = () => {
  return (
    <PageBox className={cn("flex flex-col gap-6 h-full overflow-hidden")}>
      <PageHeader title="Create User" allowBack isSticky={false} />

      {/* Form component here */}
      <Backdrop containerClassName="overflow-y-auto">
        <CreateUser />
      </Backdrop>
    </PageBox>
  );
};

export default createUserPage;
