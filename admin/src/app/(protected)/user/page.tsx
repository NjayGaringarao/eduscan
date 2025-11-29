import Backdrop from "@/components/container/Backdrop";
import PageBox from "@/components/container/PageBox";
import PageHeader from "@/components/PageHeader";
import UserManagement from "@/components/user/UserManagement";
import { cn } from "@/utils/style";

export default async function UserPage() {
  return (
    <PageBox className={cn("flex flex-col gap-4")}>
      <PageHeader title="Manage User" />
      <Backdrop containerClassName="flex-col h-full">
        <UserManagement />
      </Backdrop>
    </PageBox>
  );
}
