import UserForm from "@/components/user-form/UserForm";
import { cn } from "@/utils/style";
import { ArrowLeft } from "lucide-react";

import React from "react";

const createUserPage = () => {
  return (
    <div className={cn("flex flex-col gap-6", "h-full w-full max-w-7xl p-6")}>
      <div className="flex flex-row gap-4 items-center">
        <a
          className={cn(
            "rounded-lg",
            "hover:shadow-[0_0_4px_1px_var(--tw-shadow-color)] hover:shadow-primary/70 hover:scale-102 ",
            "transition-all transform duration-200",
            "text-base font-semibold",
            "flex flex-row gap-2 items-center justify-center"
          )}
          href="/user"
        >
          <ArrowLeft strokeWidth={3} className="text-primary h-10 w-10" />
        </a>

        <p
          className={cn(
            "text-primary text-4xl font-bold text-shadow-background text-shadow-lg "
          )}
        >
          Create User
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        {/* Form component here */}
        <UserForm />
      </div>
    </div>
  );
};

export default createUserPage;
