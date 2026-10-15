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
    <header className="h-[68px] px-6 sm:px-8 border-b border-[#ECEEF2] bg-white flex items-center justify-between shrink-0 select-none">
      {/* Title & Subtitle */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-[#4B5563] hover:text-[#111827] bg-white border border-[#ECEEF2] rounded-xl shadow-xs"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] font-sans leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#9CA3AF] mt-1 font-sans leading-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Action Controls matching reference */}
      <div className="flex items-center gap-3">
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
          className="relative w-9 h-9 rounded-full bg-white border border-[#ECEEF2] hover:border-[#D1D5DB] text-[#4B5563] hover:text-[#111827] flex items-center justify-center shadow-xs transition-all cursor-pointer"
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
