import Backdrop from "@/components/container/Backdrop";
import PageBox from "@/components/container/PageBox";
import {
  RealtimeStatus,
  SystemLogs,
  UserDemographics,
  AttendanceActivity,
  PerformanceTurnover,
} from "@/components/dashboard";
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
        <PerformanceTurnover />
        <SystemLogs />
      </Backdrop>
    </PageBox>
  );
}
