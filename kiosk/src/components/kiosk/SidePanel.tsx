"use client";

import { EllipsisIcon, Power } from "lucide-react";
import UsageSteps from "./UsageSteps";
import Button from "../Button";
import { useState } from "react";
import { Logo } from "../Logo";
import { useDialog } from "@/context/dialog";
import { useAuth } from "@/context/auth";
import { cn } from "@/utils/style";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

const SidePanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { confirm } = useDialog();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    const confirmed = await confirm({
      title: "CONFIRM SIGN OUT",
      description:
        "Are you sure you want to sign out? You can always sign back in later.",
      confirmText: "Sign Out",
      cancelText: "Cancel",
      mode: "DEFAULT",
    });

    if (!confirmed) return;

    setIsLoading(true);
    const { error } = await signOut();
    if (error) {
      alert(error);
    }
    setIsLoading(false);
  };

  return (
    <aside
      className={cn(
        "relative w-full h-screen lg:max-w-sm shadow-md p-4 ",
        "backdrop-blur-md bg-background/80",
        "flex flex-col gap-6"
      )}
    >
      <div>
        <div className="flex flex-row items-center gap-2">
          <Logo className="w-20 h-20" />
          <h1 className="text-primary text-4xl font-bold">EDUSCAN</h1>
        </div>
        <p className=" text-xs text-textBody mt-2">
          Eduscan is a smart facial recognition system for tracking students and
          employees at PRMSU Castillejos Campus.
        </p>
      </div>

      <UsageSteps />

      <div className="flex flex-col mt-auto">
        <Popover className="relative flex flex-col items-end">
          <PopoverButton className="place-self-end">
            <EllipsisIcon className="text-primary w-8 h-8" />
          </PopoverButton>
          <PopoverPanel
            className={cn(
              "absolute bottom-1 right-16",
              "w-96 mt-2 py-2 px-4 bg-background border border-primary/20 shadow-primary shadow-lg rounded-md ",
              "flex flex-col gap-2"
            )}
          >
            <div className="flex flex-row justify-between items-center pb-1 border-b border-primary/40">
              <p className="font-semibold text-xl text-textBody">Menu</p>
            </div>
            <Button
              onClick={handleSignOut}
              className="flex flex-row gap-2 text-base"
              disabled={isLoading}
            >
              <Power className="w-5 h-5" />
              Sign Out Kiosk
            </Button>
          </PopoverPanel>
        </Popover>
      </div>
    </aside>
  );
};

export default SidePanel;
