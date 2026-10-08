"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCheck, Bell, AlertTriangle, RefreshCw } from "lucide-react";
import type { OpsNotificationItem } from "@/types/ops";
import { OpsButton } from "../ui/OpsButton";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<OpsNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ops/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/ops/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isReadByMe: true }))
        );
      }
    } catch (e) {
      console.error("Failed to mark all read", e);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/ops/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isReadByMe: true } : n))
      );
    } catch (e) {
      console.error("Failed to mark notification read", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0f1118] border-l border-[#1e2230] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#1e2230] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-100">
                Team Notifications
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <OpsButton
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
              >
                Mark All Read
              </OpsButton>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No notifications to display.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.isReadByMe && handleMarkRead(item.id)}
                  className={`p-3 rounded border transition-colors cursor-pointer ${
                    item.isReadByMe
                      ? "bg-[#11131b]/60 border-[#1c202d] text-slate-400"
                      : "bg-[#161a26] border-amber-500/30 text-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-100">
                      {item.type === "QC_FAILED_REWORK" && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span>{item.title}</span>
                      {!item.isReadByMe && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{item.message}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span>By: {item.actorName}</span>
                    <span>
                      {item.orderNumber && `Order TT-${item.orderNumber}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
