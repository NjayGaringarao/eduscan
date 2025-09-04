import TableController from "@/components/user/TableController";
import { cn } from "@/utils/style";

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
      <div className="flex-1 overflow-hidden">
        <TableController />
      </div>
    </div>
  );
}
