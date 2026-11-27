"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  CheckCheck,
  Bell,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { OpsNotificationItem } from "@/types/ops";

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
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");

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
      const res = await fetch("/api/ops/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isReadByMe: true } : n))
        );
      }
    } catch (e) {
      console.error("Failed to mark notification read", e);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isReadByMe).length;
  const displayedNotifications =
    filterTab === "unread"
      ? notifications.filter((n) => !n.isReadByMe)
      : notifications;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white border-l border-[#ECEEF2] shadow-2xl flex flex-col font-sans">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#ECEEF2] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E6F7F0] text-[#00A86B] flex items-center justify-center shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#111827]">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F7F0] text-[#00A86B] border border-[#B3E8D3]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                  Real-time factory activity & stage updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-[#00A86B] hover:text-[#00925d] px-2.5 py-1.5 rounded-lg hover:bg-[#E6F7F0] flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F4F6F9] transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Sub-bar */}
          <div className="px-4 py-2.5 bg-[#F8F9FB] border-b border-[#ECEEF2] flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterTab === "all"
                    ? "bg-white text-[#111827] shadow-xs border border-[#ECEEF2]"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("unread")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterTab === "unread"
                    ? "bg-white text-[#111827] shadow-xs border border-[#ECEEF2]"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchNotifications}
              className="text-[11px] text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              /* Shimmer Skeletons */
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white border border-[#ECEEF2] space-y-2.5 animate-pulse shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 w-32 bg-[#F3F4F6] rounded-md" />
                      <div className="h-2.5 w-12 bg-[#F3F4F6] rounded-md" />
                    </div>
                    <div className="h-3 w-48 bg-[#F3F4F6] rounded-md" />
                    <div className="h-2.5 w-24 bg-[#F3F4F6] rounded-md" />
                  </div>
                ))}
              </div>
            ) : displayedNotifications.length === 0 ? (
              /* Premium Empty State */
              <div className="py-16 px-4 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#E6F7F0] text-[#00A86B] flex items-center justify-center shadow-xs">
                  <Bell className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#111827]">
                    All caught up!
                  </h4>
                  <p className="text-xs text-[#9CA3AF] max-w-xs leading-relaxed">
                    {filterTab === "unread"
                      ? "You have zero unread notifications."
                      : "No production alerts yet. Order stage advances, fabric allocations, and rework notices will appear here in real time."}
                  </p>
                </div>
              </div>
            ) : (
              /* Notification Cards */
              displayedNotifications.map((item) => {
                const isRework = item.type === "QC_FAILED_REWORK";
                const isStage =
                  item.type?.includes("STAGE") ||
                  item.type?.includes("COMPLETED");

                return (
                  <div
                    key={item.id}
                    onClick={() => !item.isReadByMe && handleMarkRead(item.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                      item.isReadByMe
                        ? "bg-white border-[#ECEEF2] hover:border-[#D1D5DB]"
                        : "bg-[#F8FAF9] border-[#B3E8D3] hover:border-[#00A86B]/60 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                            isRework
                              ? "bg-[#FEF2F2] text-[#EF4444]"
                              : isStage
                              ? "bg-[#E6F7F0] text-[#00A86B]"
                              : "bg-[#F4F6F9] text-[#4B5563]"
                          }`}
                        >
                          {isRework ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : isStage ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Bell className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#111827]">
                              {item.title}
                            </span>
                            {!item.isReadByMe && (
                              <span className="w-2 h-2 rounded-full bg-[#00A86B] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-[#4B5563] mt-0.5 leading-relaxed">
                            {item.message}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap shrink-0 mt-0.5 font-medium">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] mt-2.5 pt-2 border-t border-[#F3F4F6]">
                      <span>
                        By:{" "}
                        <strong className="text-[#111827]">
                          {item.actorName || "System"}
                        </strong>
                      </span>
                      {item.orderId && (
                        <Link
                          href={`/ops/orders/${item.orderId}`}
                          onClick={onClose}
                          className="text-[#00A86B] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                        >
                          <span>{item.orderNumber ? `TT-${item.orderNumber}` : "View Order"}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
