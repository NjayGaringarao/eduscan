import DropDown from "@/components/container/DropDown";
import KioskAuth from "@/components/config/KioskAuth";
import KioskSwitch from "@/components/config/KioskSwitch";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";
import AdminUpdatePassword from "@/components/config/AdminUpdatePassword";
import AdminChangeEmail from "@/components/config/AdminChangeEmail";
import AdminName from "@/components/config/AdminName";
import AdminTitle from "@/components/config/AdminTitle";

export default async function ConfigPage() {
  return (
    <div className={cn("flex flex-col gap-4", "w-full max-w-7xl p-2 md:p-6")}>
      <PageHeader title="Configuration" />
      <div className={cn("relative flex-1", "flex flex-col gap-4")}>
        <DropDown
          headerElement={<p className="text-primary text-xl">Admin Profile</p>}
          childClassName="flex flex-col gap-2"
          useBackDrop
          isDefaultOpen
        >
          <AdminName />
          <AdminTitle />
        </DropDown>

        <DropDown
          headerElement={
            <p className="text-primary text-xl">Admin Console Authentication</p>
          }
          childClassName="flex flex-col gap-2"
          useBackDrop
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
        >
          <KioskSwitch />
          <KioskAuth />
        </DropDown>
      </div>
    </div>
  );
}
