import DropDown from "@/components/container/DropDown";
import KioskAuth from "@/components/config/KioskAuth";
import KioskSwitch from "@/components/config/KioskSwitch";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";
import AdminUpdatePassword from "@/components/config/AdminUpdatePassword";
import AdminChangeEmail from "@/components/config/AdminChangeEmail";
import PageBox from "@/components/container/PageBox";
import AttendanceForecaster from "@/components/config/AttendanceForecaster";
import Backdrop from "@/components/container/Backdrop";

export default async function ConfigPage() {
  return (
    <PageBox className={cn("flex flex-col gap-4")}>
      <PageHeader title="Configuration" />
      <Backdrop
        containerClassName={cn(
          "relative flex-1 overflow-y-auto flex flex-col gap-4"
        )}
      >
        <DropDown
          headerElement={
            <p className="text-primary text-xl font-semibold">
              Admin Console Authentication
            </p>
          }
          childClassName="flex flex-col gap-2"
          isDefaultOpen
        >
          <AdminChangeEmail />
          <AdminUpdatePassword />
        </DropDown>

        <DropDown
          headerElement={
            <p className="text-primary text-xl font-semibold">
              Kiosk Configuration
            </p>
          }
          childClassName="flex flex-col gap-2"
          isDefaultOpen
        >
          <KioskSwitch />
          <KioskAuth />
        </DropDown>

        <DropDown
          headerElement={
            <p className="text-primary text-xl font-semibold">
              Machine Learning
            </p>
          }
          childClassName="flex flex-col gap-2"
          isDefaultOpen
        >
          <AttendanceForecaster />
        </DropDown>
      </Backdrop>
    </PageBox>
  );
}
