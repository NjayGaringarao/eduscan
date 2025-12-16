"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import {
  User,
  LogOut,
  LucideProps,
  Settings,
  Megaphone,
  LayoutDashboardIcon,
  ActivityIcon,
  FileSpreadsheet,
} from "lucide-react";
import { signOut } from "@/lib/auth";
import {
  ForwardRefExoticComponent,
  RefAttributes,
  useEffect,
  useState,
} from "react";
import { useScreenSize } from "@/hooks/useScreenSIze";
import { cn } from "@/utils/style";

export default function NavBar() {
  const screenSize = useScreenSize();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [tabs, setTabs] = useState<
    {
      href: string;
      label: string;
      icon: ForwardRefExoticComponent<
        Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
      >;
    }[]
  >([]);

  const handleSignOut = async () => {
    if (!window.confirm("Are you sure you want to sign out?")) {
      return;
    }
    setIsLoading(true);
    const { error } = await signOut();
    if (error) {
      alert(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (screenSize == "large" || screenSize == "extralarge") {
      setTabs([
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
        { href: "/user", label: "User", icon: User },

        {
          href: "/session_log",
          label: "Session Log",
          icon: ActivityIcon,
        },
        { href: "/dtr", label: "Daily Time Record", icon: FileSpreadsheet },
        { href: "/announcement", label: "Announcement", icon: Megaphone },
        { href: "/config", label: "Configuration", icon: Settings },
      ]);
    } else {
      setTabs([
        { href: "/user", label: "User", icon: User },
        { href: "/dtr", label: "Daily Time Record", icon: FileSpreadsheet },
        { href: "/announcement", label: "Announcement", icon: Megaphone },
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
        {
          href: "/session_log",
          label: "Session Log",
          icon: ActivityIcon,
        },

        { href: "/config", label: "Configuration", icon: Settings },
      ]);
    }
  }, [screenSize]);

  useEffect(() => {
    setIsVisible(tabs.some((tab) => tab.href === pathname));
  }, [pathname, tabs]);

  return (
    <div
      className={cn(
        "absolute md:static bottom-0 left-0 right-0 z-50",
        "md:w-26 lg:w-64",
        "bg-background/20 backdrop-blur-md"
      )}
    >
      {/* Desktop Header (Hidden on Mobile) */}
      <div className="hidden md:flex items-end justify-between bg-background p-2 lg:p-4">
        <Logo className="w-32 lg:w-20" />
        <div className=" hidden lg:flex flex-col items-start">
          <h1 className="text-primary lg:text-3xl font-bold text-center">
            EDUSCAN
          </h1>
          <p className="text-primary lg:text-[10px] text-center -mt-1 ml-1 mb-1">
            PRMSU - Castillejos Campus
          </p>
        </div>
      </div>
      <div className="hidden md:flex flex-col items-center bg-textBody p-2 lg:p-4">
        <p className="text-background text-xl self-center hidden lg:block">
          Administrator Console
        </p>
      </div>
      <nav
        className={cn(
          "flex md:flex-col md:gap-6 justify-between md:justify-start",
          "p-2 lg:p-0",
          isVisible ? "visible" : "hidden"
        )}
      >
        {/* Tabs */}
        <ul className="flex md:flex-col justify-around lg:justify-start items-center w-full">
          {tabs.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href} className="w-full">
                <Link
                  href={href}
                  className={cn(
                    "px-4 py-3 rounded border-b-8 md:border-b-0 md:border-l-8 border-transparent",
                    "text-base text-primary",
                    "lg:justify-start flex flex-row justify-center items-center gap-4",
                    isActive
                      ? "border-primary font-semibold bg-secondary"
                      : "hover:bg-secondary/50 hover:border-primary/50"
                  )}
                >
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 3 : 2} />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              </li>
            );
          })}
          <li className="w-full" key="signout">
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className={cn(
                "w-full px-4 py-3 rounded border-l-8 border-transparent",
                "flex justify-center lg:justify-start items-center gap-4",
                "text-primary hover:bg-secondary/50 hover:border-primary/50"
              )}
            >
              <LogOut className="w-8 h-8" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
