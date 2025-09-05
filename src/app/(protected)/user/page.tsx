import TableController from "@/components/user/TableController";
import { cn } from "@/utils/style";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

export default async function UserPage() {
  return (
    <div className={cn("flex flex-col gap-6", "h-full w-full max-w-7xl p-6")}>
      <h1
        className={cn(
          "text-primary text-4xl font-bold text-shadow-background text-shadow-lg "
        )}
      >
        Manage User
      </h1>
      <div className="relative flex-1 overflow-hidden">
        <TableController />
        <a
          className={cn(
            "absolute top-6 right-6",
            "p-1 md:px-4 rounded-lg shadow-lg py-2",
            "hover:shadow-[0_0_4px_1px_var(--tw-shadow-color)] hover:shadow-primary/70 hover:scale-102 ",
            "transition-all transform duration-200",
            "text-base font-semibold",
            "flex flex-row gap-2 items-center justify-center",
            "border border-primary",
            "bg-primary text-background"
          )}
          href="/user/create"
        >
          <Plus className="text-background" /> Create User
        </a>
      </div>
    </div>
  );
}
