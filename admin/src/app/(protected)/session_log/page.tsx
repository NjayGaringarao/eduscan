import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";
import PageBox from "@/components/container/PageBox";
import SessionLogManagement from "@/components/session_log/SessionLogManagement";
import Backdrop from "@/components/container/Backdrop";

export default async function SessionLogPage() {
  return (
    <PageBox className={cn("flex flex-col gap-4")}>
      <PageHeader title="Session Log" />
      <Backdrop containerClassName="flex-col h-full">
        <SessionLogManagement />
      </Backdrop>
    </PageBox>
  );
}
