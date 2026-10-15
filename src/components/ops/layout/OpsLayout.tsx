"use client";

import React, { useState, useEffect, useRef } from "react";
import { OpsSidebar } from "./OpsSidebar";
import { OpsHeader } from "./OpsHeader";
import type { OpsEmployee } from "@/types/ops";
import { NotificationDrawer } from "../notifications/NotificationDrawer";
import { Toaster, toast } from "react-hot-toast";

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  } catch (e) {
    // Audio context may require user gesture in some browsers
  }
}

interface OpsLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  headerAction?: React.ReactNode;
}

export const OpsLayout: React.FC<OpsLayoutProps> = ({
  children,
  pageTitle,
  pageSubtitle,
  headerAction,
}) => {
  const [employee, setEmployee] = useState<OpsEmployee | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const previousUnreadRef = useRef<number | null>(null);

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
        const newCount = data.unreadCount || 0;

        // If count increased while session was already active, chime and alert!
        if (previousUnreadRef.current !== null && newCount > previousUnreadRef.current) {
          playNotificationChime();
          const firstNotif = data.notifications?.[0];
          if (firstNotif) {
            toast(
              (t) => (
                <div
                  onClick={() => {
                    setIsNotificationsOpen(true);
                    toast.dismiss(t.id);
                  }}
                  className="cursor-pointer text-xs space-y-0.5"
                >
                  <div className="font-bold text-[#111827] flex items-center gap-1.5">
                    <span>🔔</span>
                    <span>{firstNotif.title}</span>
                  </div>
                  <p className="text-[#4B5563] text-[11px] line-clamp-2">
                    {firstNotif.message}
                  </p>
                </div>
              ),
              { duration: 5000, position: "top-right" }
            );
          }
        }

        previousUnreadRef.current = newCount;
        setUnreadCount(newCount);
      }
    } catch (e) {
      console.error("Failed to fetch notification count", e);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#FDFDFE] flex flex-col md:flex-row m-0 p-0 text-[#111827]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0 w-64 lg:w-72 border-r border-[#ECEEF2] bg-white h-screen sticky top-0 overflow-hidden">
        <OpsSidebar employee={employee} unreadNotificationsCount={unreadCount} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col">
            <OpsSidebar
              employee={employee}
              unreadNotificationsCount={unreadCount}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#FDFDFE]">
        <OpsHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          headerAction={headerAction}
          employee={employee}
          unreadNotificationsCount={unreadCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-7 lg:p-8 bg-[#FDFDFE] overflow-y-auto">
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

      {/* Global Hot Toast Container */}
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", background: "#fff", color: "#111827", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #ECEEF2" } }} />
    </div>
  );
};
