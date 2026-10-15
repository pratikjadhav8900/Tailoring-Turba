"use client";

import React from "react";
import { Bell, ArrowUpRight, Upload, Menu } from "lucide-react";
import type { OpsEmployee } from "@/types/ops";

interface OpsHeaderProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  employee?: OpsEmployee | null;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenMobileSidebar?: () => void;
}

export const OpsHeader: React.FC<OpsHeaderProps> = ({
  title = "Dashboard",
  subtitle = "Welcome to Analysis dashboard",
  headerAction,
  employee,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenMobileSidebar,
}) => {
  return (
    <header className="h-[64px] sm:h-[68px] px-4 sm:px-8 border-b border-[#ECEEF2] bg-white flex items-center justify-between shrink-0 select-none sticky top-0 z-30">
      {/* Title & Subtitle */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 pr-2">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-[#4B5563] hover:text-[#111827] bg-white border border-[#ECEEF2] rounded-xl shadow-xs shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-bold tracking-tight text-[#111827] font-sans leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-[#9CA3AF] mt-0.5 font-sans leading-none truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Action Controls matching reference */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {headerAction ? (
          headerAction
        ) : (
          <button className="h-9 px-4 sm:px-5 rounded-full bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}

        {/* Circular Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative w-9 h-9 rounded-full bg-white border border-[#ECEEF2] hover:border-[#D1D5DB] text-[#4B5563] hover:text-[#111827] flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00A86B]" />
          )}
        </button>
      </div>
    </header>
  );
};
