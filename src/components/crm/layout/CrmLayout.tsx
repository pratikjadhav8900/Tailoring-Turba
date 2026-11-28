"use client";

import React, { useState, useEffect } from "react";
import { CrmSidebar } from "./CrmSidebar";
import { CrmHeader } from "./CrmHeader";
import { CrmNotificationDrawer } from "../notifications/CrmNotificationDrawer";
import type { CrmEmployee } from "@/types/crm";
import { Toaster } from "react-hot-toast";

interface CrmLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  headerAction?: React.ReactNode;
}

export const CrmLayout: React.FC<CrmLayoutProps> = ({
  children,
  pageTitle,
  pageSubtitle,
  headerAction,
}) => {
  const [employee, setEmployee] = useState<CrmEmployee | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/crm/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) setEmployee(data.employee);
      })
      .catch(() => {});
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/crm/notifications?unreadOnly=true");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Failed to fetch CRM notification count", e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#FDFDFE] flex flex-col md:flex-row m-0 p-0 text-[#111827]">
      <div className="hidden md:block shrink-0 w-64 lg:w-72 border-r border-[#ECEEF2] bg-white h-screen sticky top-0 overflow-hidden">
        <CrmSidebar employee={employee} />
      </div>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col">
            <CrmSidebar employee={employee} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#FDFDFE]">
        <CrmHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          headerAction={headerAction}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          unreadNotificationsCount={unreadCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-7 lg:p-8 bg-[#FDFDFE] overflow-y-auto">
          {children}
        </main>
      </div>

      <CrmNotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          fetchUnreadCount();
        }}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "#fff",
            color: "#111827",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            border: "1px solid #ECEEF2",
          },
        }}
      />
    </div>
  );
};
