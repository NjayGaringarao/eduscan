import RecognitionCamera from "@/components/face-id/RecognitionCamera";
import SidePanel from "@/components/kiosk/SidePanel";
import { cn } from "@/utils/style";

export const Kiosk = () => {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "w-screen h-screen bg-background overflow-y-auto"
      )}
    >
      <img
        src={"/image/prmsu-foreground.png"}
        alt="PRMSU Logo"
        className="absolute w-full h-full dark:opacity-10"
        style={{ objectFit: "cover" }}
      />
      <div className="relative z-10 flex min-h-screen w-full">
        <div className="flex flex-row flex-1">
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <RecognitionCamera />
          </div>
          <SidePanel />
        </div>
      </div>
    </div>
  );
};
