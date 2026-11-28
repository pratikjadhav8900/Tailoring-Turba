"use client";

import React from "react";
import { Bell, Menu } from "lucide-react";

interface CrmHeaderProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  onOpenMobileSidebar?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const CrmHeader: React.FC<CrmHeaderProps> = ({
  title = "Dashboard",
  subtitle,
  headerAction,
  onOpenMobileSidebar,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  return (
    <header className="h-[64px] sm:h-[68px] px-4 sm:px-8 border-b border-[#ECEEF2] bg-white flex items-center justify-between shrink-0 select-none sticky top-0 z-30">
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

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {headerAction}
        <button
          onClick={onOpenNotifications}
          className="relative w-9 h-9 rounded-full bg-white border border-[#ECEEF2] hover:border-[#D1D5DB] text-[#4B5563] hover:text-[#111827] flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF6A39]" />
          )}
        </button>
      </div>
    </header>
  );
};
