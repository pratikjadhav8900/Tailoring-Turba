"use client";

import React, { useState, useEffect } from "react";
import { OpsSidebar } from "./OpsSidebar";
import { OpsHeader } from "./OpsHeader";
import type { OpsEmployee } from "@/types/ops";
import { NotificationDrawer } from "../notifications/NotificationDrawer";

interface OpsLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const OpsLayout: React.FC<OpsLayoutProps> = ({
  children,
  pageTitle,
}) => {
  const [employee, setEmployee] = useState<OpsEmployee | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/ops/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setEmployee(data.employee);
        }
      }
    } catch (e) {
      console.error("Failed to load ops session", e);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const res = await fetch("/api/ops/notifications?unreadOnly=true");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Failed to fetch notification count", e);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ops-root flex h-screen overflow-hidden bg-[#090a0f] text-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">
        <OpsSidebar employee={employee} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-[80vw]">
            <OpsSidebar
              employee={employee}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <OpsHeader
          title={pageTitle}
          employee={employee}
          unreadNotificationsCount={unreadCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#090a0f]">
          {children}
        </main>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          fetchNotificationCount();
        }}
      />
    </div>
  );
};
