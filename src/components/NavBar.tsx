"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import {
  Home,
  User,
  LogOut,
  LucideProps,
  Settings,
  Megaphone,
  Logs,
} from "lucide-react"; // You can change icons as needed
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
        { href: "/home", label: "Home", icon: Home },
        { href: "/user", label: "User", icon: User },
        { href: "/announcement", label: "Announcement", icon: Megaphone },
        { href: "/config", label: "Configuration", icon: Settings },
        { href: "/log", label: "System Logs", icon: Logs },
      ]);
    } else {
      setTabs([
        { href: "/user", label: "User", icon: User },
        { href: "/config", label: "Configuration", icon: Settings },
        { href: "/home", label: "Home", icon: Home },
        { href: "/announcement", label: "Announcement", icon: Megaphone },
        { href: "/log", label: "System Logs", icon: Logs },
      ]);
    }
  }, [screenSize]);
  return (
    <nav
      className={cn(
        "fixed md:static bottom-0 left-0 right-0 z-50",
        "lg:p-4 md:w-26 lg:w-64 p-2",
        "bg-background/20 backdrop-blur-md",
        "flex md:flex-col md:gap-6 justify-between md:justify-start"
      )}
    >
      {/* Desktop Header (Hidden on Mobile) */}
      <div className="hidden md:flex flex-col items-center">
        <Logo className="w-32 lg:w-52" />
        <h1 className="text-primary hidden lg:block lg:text-3xl font-bold text-center -ml-4">
          EDUSCAN
        </h1>
      </div>

      {/* Tabs */}
      <ul className="flex md:flex-col justify-around lg:justify-start items-center w-full md:space-y-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="w-full">
              <Link
                href={href}
                className={cn(
                  "h-16 px-4 py-2 rounded border-b-8 md:border-b-0 md:border-l-8 border-transparent",
                  "text-base text-primary",
                  "lg:justify-start flex flex-row justify-center items-center gap-4",
                  isActive
                    ? "border-primary font-semibold bg-secondary"
                    : "hover:bg-secondary/50 hover:border-primary/50"
                )}
              >
                <Icon className="w-8 h-8" strokeWidth={isActive ? 3 : 2} />
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
              "h-16 w-full px-4 py-2 rounded border-l-8 border-transparent",
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
  );
}
