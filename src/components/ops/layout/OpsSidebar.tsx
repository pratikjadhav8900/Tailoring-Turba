"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  Package,
  Inbox,
  Users,
  MessageSquare,
  User,
  Settings,
  HelpCircle,
  Rocket,
  ArrowUpRight,
  LogOut,
  CheckSquare,
} from "lucide-react";
import type { OpsEmployee } from "@/types/ops";
import { signOut } from "next-auth/react";

interface OpsSidebarProps {
  employee?: OpsEmployee | null;
  unreadNotificationsCount?: number;
  onCloseMobile?: () => void;
}

const OpsSidebarInner: React.FC<OpsSidebarProps> = ({
  employee,
  unreadNotificationsCount = 0,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isKanban = pathname === "/ops/orders" && searchParams.get("view") === "kanban";

  const mainMenu = [
    {
      label: "Dashboard",
      href: "/ops",
      icon: <LayoutGrid className="w-4 h-4" />,
      isActive: pathname === "/ops",
    },
    {
      label: "Worker Tasks",
      href: "/ops/tasks",
      icon: <CheckSquare className="w-4 h-4" />,
      isActive: pathname === "/ops/tasks",
    },
    {
      label: "Orders",
      href: "/ops/orders",
      icon: <Package className="w-4 h-4" />,
      isActive: pathname === "/ops/orders" && !isKanban,
    },
    {
      label: "Pipeline",
      href: "/ops/orders?view=kanban",
      icon: <Inbox className="w-4 h-4" />,
      isActive: isKanban,
    },
    {
      label: "Customers",
      href: "/ops/orders",
      icon: <Users className="w-4 h-4" />,
      isActive: false,
    },
    {
      label: "Chat",
      href: "/ops/chat",
      icon: <MessageSquare className="w-4 h-4" />,
      isActive: pathname === "/ops/chat",
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
  ];

  const otherMenu = [
    {
      label: "Account",
      href: "/ops/account",
      icon: <User className="w-4 h-4" />,
      isActive: pathname === "/ops/account",
    },
    {
      label: "Settings",
      href: "/ops/settings",
      icon: <Settings className="w-4 h-4" />,
      isActive: pathname === "/ops/settings",
    },
    {
      label: "Help Center",
      href: "/ops/help",
      icon: <HelpCircle className="w-4 h-4" />,
      isActive: pathname === "/ops/help",
    },
  ];

  return (
    <aside className="w-full h-full flex flex-col justify-between bg-white select-none">
      {/* Top Brand Header matching OpsHeader 68px height and border */}
      <div className="h-[68px] px-6 border-b border-[#ECEEF2] flex items-center shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#ECEEF2] flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
            <Image
              src="/turba-logo-mark.png"
              alt="Tailoring Turba"
              width={24}
              height={24}
              className="object-contain"
              unoptimized
            />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-[#111827] font-sans block leading-none">
              Tailoring Turba
            </span>
            <span className="text-[10px] font-bold text-[#00A86B] uppercase tracking-wider block mt-1 leading-none">
              OPS STATION
            </span>
          </div>
        </div>
      </div>

      {/* Main Menu Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        <div>
          <div className="text-[11px] font-medium text-[#9CA3AF] px-3 mb-2.5">
            Main Menu
          </div>
          <nav className="space-y-1">
            {mainMenu.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onCloseMobile}
                className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  item.isActive
                    ? "text-[#111827] bg-[#F4F6F9]"
                    : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]"
                }`}
              >
                {/* Left emerald pill indicator for active item */}
                {item.isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#00A86B] rounded-r-full" />
                )}

                <div className="flex items-center gap-3">
                  <span className={item.isActive ? "text-[#00A86B]" : "text-[#9CA3AF]"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00A86B] text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Other Section */}
        <div>
          <div className="text-[11px] font-medium text-[#9CA3AF] px-3 mb-2.5">
            Other
          </div>
          <nav className="space-y-1">
            {otherMenu.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onCloseMobile}
                className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  item.isActive
                    ? "text-[#111827] bg-[#F4F6F9]"
                    : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]"
                }`}
              >
                {item.isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#00A86B] rounded-r-full" />
                )}

                <div className="flex items-center gap-3">
                  <span className={item.isActive ? "text-[#00A86B]" : "text-[#9CA3AF]"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom Card matching reference ("Start Premium Service") */}
      <div className="p-4 border-t border-[#ECEEF2] shrink-0 bg-white">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#EEF7F2] via-[#F4FAF6] to-[#F1F6FA] border border-[#E1EFE6] relative overflow-hidden">
          <div className="flex items-start justify-between mb-2.5">
            <div>
              <div className="font-bold text-xs text-[#111827] leading-snug">
                Start Premium<br />Service
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shadow-md">
              <Rocket className="w-3.5 h-3.5" />
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/ops/login" })}
            className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-[#FAFAFA] text-[#111827] text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs border border-white transition-all cursor-pointer"
          >
            <span>{employee?.name ? `Sign Out (${employee.employeeCode})` : "Upgrade Now"}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#00A86B]" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export const OpsSidebar: React.FC<OpsSidebarProps> = (props) => {
  return (
    <React.Suspense fallback={<aside className="w-full h-full bg-white" />}>
      <OpsSidebarInner {...props} />
    </React.Suspense>
  );
};
