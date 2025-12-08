import DropDown from "@/components/container/DropDown";
import KioskAuth from "@/components/config/KioskAuth";
import KioskSwitch from "@/components/config/KioskSwitch";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";
import AdminUpdatePassword from "@/components/config/AdminUpdatePassword";
import AdminChangeEmail from "@/components/config/AdminChangeEmail";
import PageBox from "@/components/container/PageBox";
import AttendanceForecaster from "@/components/config/AttendanceForecaster";

export default async function ConfigPage() {
  return (
    <PageBox className={cn("flex flex-col gap-4")}>
      <PageHeader title="Configuration" />
      <div className={cn("relative flex-1", "flex flex-col gap-4")}>
        <DropDown
          headerElement={
            <p className="text-primary text-xl">Admin Console Authentication</p>
          }
          childClassName="flex flex-col gap-2"
          useBackDrop
          isDefaultOpen
        >
          <AdminChangeEmail />
          <AdminUpdatePassword />
        </DropDown>

        <DropDown
          headerElement={
            <p className="text-primary text-xl">Kiosk Configuration</p>
          }
          childClassName="flex flex-col gap-2"
          useBackDrop
          isDefaultOpen
        >
          <KioskSwitch />
          <KioskAuth />
        </DropDown>

        <DropDown
          headerElement={
            <p className="text-primary text-xl">Machine Learning</p>
          }
          childClassName="flex flex-col gap-2"
          useBackDrop
          isDefaultOpen
        >
          <AttendanceForecaster />
        </DropDown>
      </div>
    </PageBox>
  );
}
