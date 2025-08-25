import { RealtimeUserStatus, AttendanceTrend } from "@/components/home";
import { getGreeting } from "@/utils/string";
import { cn } from "@/utils/style";

export default async function HomePage() {
  return (
    <div className={cn("flex flex-1 flex-col gap-6", "w-full max-w-7xl p-6")}>
      <h1
        className={cn(
          "text-primary text-4xl font-bold text-shadow-background text-shadow-lg ",
          "mt-12 "
        )}
      >
        {getGreeting()}
      </h1>
      <RealtimeUserStatus />
      <AttendanceTrend />
    </div>
  );
}
