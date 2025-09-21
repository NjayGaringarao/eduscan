import Backdrop from "@/components/container/Backdrop";
import DropDown from "@/components/container/DropDown";
import { RealtimeStatus } from "@/components/dashboard";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";

export default async function DashboardPage() {
  return (
    <div className={cn("flex flex-1 flex-col gap-6", "w-full max-w-7xl p-6")}>
      <PageHeader title="Dashboard" />
      <Backdrop>
        <DropDown
          headerElement={
            <p className="text-primary text-xl font-bold">Realtime</p>
          }
          isDefaultOpen
        >
          <RealtimeStatus />
        </DropDown>
      </Backdrop>
    </div>
  );
}
