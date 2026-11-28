"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  ListChecks,
  Mail,
  MessageCircle,
  Settings,
  HelpCircle,
  Rocket,
  ArrowUpRight,
} from "lucide-react";
import type { CrmEmployee } from "@/types/crm";
import { signOut } from "next-auth/react";

interface CrmSidebarProps {
  employee?: CrmEmployee | null;
  onCloseMobile?: () => void;
}

export const CrmSidebar: React.FC<CrmSidebarProps> = ({ employee, onCloseMobile }) => {
  const pathname = usePathname();

  const mainMenu = [
    {
      label: "Dashboard",
      href: "/crm",
      icon: <LayoutGrid className="w-4 h-4" />,
      isActive: pathname === "/crm",
    },
    {
      label: "Leads",
      href: "/crm/leads",
      icon: <Users className="w-4 h-4" />,
      isActive: pathname.startsWith("/crm/leads"),
    },
    {
      label: "Tasks & Follow-ups",
      href: "/crm/tasks",
      icon: <ListChecks className="w-4 h-4" />,
      isActive: pathname.startsWith("/crm/tasks"),
    },
    {
      label: "Campaigns",
      href: "/crm/campaigns",
      icon: <Mail className="w-4 h-4" />,
      isActive: pathname.startsWith("/crm/campaigns"),
    },
    {
      label: "WhatsApp",
      href: "/crm/whatsapp",
      icon: <MessageCircle className="w-4 h-4" />,
      isActive: pathname.startsWith("/crm/whatsapp"),
    },
  ];

  const otherMenu = [
    {
      label: "Settings",
      href: "/crm/settings",
      icon: <Settings className="w-4 h-4" />,
      isActive: pathname === "/crm/settings",
    },
    {
      label: "Help Center",
      href: "/crm/help",
      icon: <HelpCircle className="w-4 h-4" />,
      isActive: pathname === "/crm/help",
    },
  ];

  return (
    <aside className="w-full h-full flex flex-col justify-between bg-white select-none">
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
            <span className="text-[10px] font-bold text-[#FF6A39] uppercase tracking-wider block mt-1 leading-none">
              SALES CRM
            </span>
          </div>
        </div>
      </div>

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
                {item.isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FF6A39] rounded-r-full" />
                )}
                <div className="flex items-center gap-3">
                  <span className={item.isActive ? "text-[#FF6A39]" : "text-[#9CA3AF]"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

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
                className="relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#9CA3AF]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-[#ECEEF2] shrink-0 bg-white">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FFF1EB] via-[#FFF6F2] to-[#FDF3FA] border border-[#FFE1D1] relative overflow-hidden">
          <div className="flex items-start justify-between mb-2.5">
            <div>
              <div className="font-bold text-xs text-[#111827] leading-snug">
                {employee?.name || "Sales Rep"}
              </div>
              <div className="text-[10px] text-[#6B7280] mt-0.5">
                {employee?.employeeCode || ""}
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shadow-md">
              <Rocket className="w-3.5 h-3.5" />
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/crm/login" })}
            className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-[#FAFAFA] text-[#111827] text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs border border-white transition-all cursor-pointer"
          >
            <span>Sign Out</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#FF6A39]" />
          </button>
        </div>
      </div>
    </aside>
  );
};
