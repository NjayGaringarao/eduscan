import DropDown from "@/components/DropDown";
import KioskAuth from "@/components/config/KioskAuth";
import KioskSwitch from "@/components/config/KioskSwitch";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";
import AdminUpdatePassword from "@/components/config/AdminUpdatePassword";
import AdminChangeEmail from "@/components/config/AdminChangeEmail";

export default async function ConfigPage() {
  return (
    <div className={cn("flex flex-col gap-4", "w-full max-w-7xl p-2 md:p-6")}>
      <PageHeader title="Configuration" />
      <div className={cn("relative flex-1", "flex flex-col gap-4")}>
        <DropDown
          headerElement={
            <p className="text-primary text-xl">Admin Console Authentication</p>
          }
          containerClassName="border border-textBody/20 p-4 bg-background/30 rounded-xl backdrop-blur-sm"
          childClassName="flex flex-col gap-2"
          isDefaultOpen
        >
          <AdminChangeEmail />
          <AdminUpdatePassword />
        </DropDown>

        <DropDown
          headerElement={
            <p className="text-primary text-xl">Kiosk Configuration</p>
          }
          containerClassName="border border-textBody/20 p-4 bg-background/30 rounded-xl backdrop-blur-sm"
          childClassName="flex flex-col gap-2"
          isDefaultOpen
        >
          <KioskSwitch />
          <KioskAuth />
        </DropDown>
      </div>
    </div>
  );
}
