import Backdrop from "@/components/container/Backdrop";
import PageBox from "@/components/container/PageBox";
import { RealtimeStatus } from "@/components/dashboard";
import AttendanceActivity from "@/components/dashboard/AttendanceActivity";
import UserDemographics from "@/components/dashboard/UserDemographics";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";

export default async function DashboardPage() {
  return (
    <PageBox className={cn("flex flex-col gap-4")}>
      <PageHeader title="Dashboard" />
      <Backdrop containerClassName="flex flex-col gap-6 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <RealtimeStatus />
          <UserDemographics />
        </div>

        <AttendanceActivity />
      </Backdrop>
    </PageBox>
  );
}
