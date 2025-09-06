import PageHeader from "@/components/PageHeader";
import TableController from "@/components/user/TableController";
import { cn } from "@/utils/style";

export default async function UserPage() {
  return (
    <div className={cn("flex flex-col gap-4", "h-full w-full max-w-7xl p-6")}>
      <PageHeader title="Manage User" />
      <div className="relative flex-1 overflow-hidden">
        <TableController />
      </div>
    </div>
  );
}
