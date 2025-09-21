import Backdrop from "@/components/container/Backdrop";
import DropDown from "@/components/container/DropDown";
import { RealtimeStatus } from "@/components/dashboard";
import UserDemographics from "@/components/dashboard/UserDemographics";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";

export default async function DashboardPage() {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-6",
        "w-full max-w-7xl py-4 md:p-6"
      )}
    >
      <PageHeader title="Dashboard" />
      <Backdrop containerClassName="flex flex-col gap-6 p-6">
        <DropDown
          headerElement={
            <p className="text-primary text-xl font-bold">Realtime</p>
          }
          isDefaultOpen
        >
          <div className="flex flex-col md:flex-row gap-6">
            <RealtimeStatus />
            <UserDemographics />
          </div>
        </DropDown>
      </Backdrop>
    </div>
  );
}
