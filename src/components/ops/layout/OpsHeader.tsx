"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, Shield } from "lucide-react";
import type { OpsEmployee } from "@/types/ops";

interface OpsHeaderProps {
  title?: string;
  employee?: OpsEmployee | null;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenMobileSidebar?: () => void;
}

export const OpsHeader: React.FC<OpsHeaderProps> = ({
  title,
  employee,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenMobileSidebar,
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/ops/orders?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-14 bg-[#0d0f15] border-b border-[#1e2230] px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] rounded"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-sm font-bold text-slate-100 tracking-tight hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      {/* Global Quick Search */}
      <div className="flex-1 max-w-md mx-2">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order TT-..., customer, or phone..."
            className="w-full bg-[#13151f] border border-[#1e2230] focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-colors"
          />
        </form>
      </div>

      {/* Action Indicators */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] rounded transition-colors"
          title="Team Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-[#090a0f] text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Employee badge in header for mobile / fast view */}
        <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-[#1e2230] text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-medium text-slate-300">{employee?.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            {employee?.roleTitle || "Staff"}
          </span>
        </div>
      </div>
    </header>
  );
};
