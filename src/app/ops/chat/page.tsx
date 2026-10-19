"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { OpsCard } from "@/components/ops/ui/OpsCard";
import { OpsButton } from "@/components/ops/ui/OpsButton";
import { OpsLoadingState } from "@/components/ops/ui/OpsLoadingState";
import {
  MessageSquare,
  Send,
  Hash,
  AlertTriangle,
  Radio,
  Users,
  Paperclip,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface ChatMessage {
  id: string;
  channel: string;
  message: string;
  senderName: string;
  senderCode: string;
  senderRole: string;
  priority: "NORMAL" | "URGENT" | "ANNOUNCEMENT";
  orderNumber?: number | null;
  createdAt: string;
  isSelf: boolean;
}

const CHANNELS = [
  { id: "general", name: "general-floor", label: "General Floor Talk", icon: Hash },
  { id: "urgent-alerts", name: "urgent-alerts", label: "Urgent & Rush Alerts", icon: AlertTriangle },
  { id: "order-queries", name: "order-queries", label: "Order & Artwork Checks", icon: MessageSquare },
  { id: "dispatch", name: "dispatch-handover", label: "Dispatch & Courier", icon: Radio },
];

const TEAM_MEMBERS = [
  { code: "TT001", name: "Neeraj Shingavi", role: "Founder" },
  { code: "TT002", name: "Sanjay Shingavi", role: "Co-Founder" },
  { code: "TT003", name: "Pratik Jadhav", role: "Sales & Tech Dev" },
  { code: "TT004", name: "Mahesh Ghavale", role: "Cutting & Floor Lead" },
  { code: "TT005", name: "Ajay", role: "Stitching & Assembly" },
];

export default function OpsTeamChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState("general");
  const [inputText, setInputText] = useState("");
  const [orderTagInput, setOrderTagInput] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT" | "ANNOUNCEMENT">("NORMAL");
  const [isSending, setIsSending] = useState(false);
  const [showOrderTagModal, setShowOrderTagModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async (isInitial = false) => {
    try {
      const res = await fetch(`/api/ops/chat?channel=${activeChannel}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Failed to load chat messages", e);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/ops/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          channel: activeChannel,
          orderNumber: orderTagInput ? parseInt(orderTagInput.replace(/#/g, ""), 10) : null,
          priority,
        }),
      });

      if (res.ok) {
        setInputText("");
        setOrderTagInput("");
        setPriority("NORMAL");
        setShowOrderTagModal(false);
        fetchMessages(false);
      } else {
        toast.error("Failed to send message");
      }
    } catch (err) {
      toast.error("Network error sending message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <OpsLayout
      pageTitle="Floor Team Broadcast"
      pageSubtitle="Real-time internal chat and order tagging channel for the 5 Turba Ops staff members"
    >
      <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white border border-[#ECEEF2] rounded-[24px] shadow-sm overflow-hidden">
        {/* Chat Workspace Header */}
        <div className="h-14 px-6 border-b border-[#ECEEF2] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E6F7F0] text-[#00A86B] flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#111827]">
                #{CHANNELS.find((c) => c.id === activeChannel)?.name || activeChannel}
              </div>
              <div className="text-[10px] text-[#9CA3AF]">
                {CHANNELS.find((c) => c.id === activeChannel)?.label} • 5 team members online
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
            <span className="text-[11px] font-bold text-[#00A86B]">Live Floor Link</span>
          </div>
        </div>

        {/* Chat Main Grid: Channel Sidebar + Messages Container */}
        <div className="flex-1 flex min-h-0">
          {/* Left Channel & Staff List */}
          <div className="w-56 sm:w-64 border-r border-[#ECEEF2] bg-[#FDFDFE] flex flex-col shrink-0">
            {/* Channels List */}
            <div className="p-3 space-y-1">
              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider px-2 py-1">
                Channels
              </div>
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const isActive = activeChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveChannel(ch.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#00A86B] text-white shadow-xs"
                        : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">#{ch.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Staff Presence Directory */}
            <div className="p-3 pt-2 border-t border-[#ECEEF2] flex-1 overflow-y-auto space-y-1">
              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                <span>Staff Online (5)</span>
                <Users className="w-3 h-3 text-[#9CA3AF]" />
              </div>
              {TEAM_MEMBERS.map((m) => (
                <div
                  key={m.code}
                  className="px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs hover:bg-[#F4F6F9] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] shrink-0" />
                    <span className="font-semibold text-[#111827] truncate text-[11px]">{m.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#00A86B] font-bold bg-[#E6F7F0] px-1.5 py-0.5 rounded-sm shrink-0">
                    {m.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Message Feed & Composer */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FB]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {loading ? (
                <OpsLoadingState message="Loading team broadcast..." />
              ) : messages.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#E6F7F0] text-[#00A86B] flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Welcome to #{CHANNELS.find((c) => c.id === activeChannel)?.name}
                  </h3>
                  <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
                    This is the start of the #{activeChannel} team channel. Broadcast manufacturing instructions, ask questions, or link orders.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-2xl ${
                        msg.isSelf ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                          msg.isSelf ? "bg-[#00A86B]" : "bg-[#1E293B]"
                        }`}
                      >
                        {msg.senderCode || "TT"}
                      </div>

                      {/* Content Bubble */}
                      <div className="space-y-1 min-w-0">
                        {/* Meta header */}
                        <div
                          className={`flex items-center gap-2 text-[10px] ${
                            msg.isSelf ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="font-bold text-[#111827]">{msg.senderName}</span>
                          <span className="text-[#9CA3AF]">{msg.senderRole}</span>
                          <span className="text-[#9CA3AF]">
                            {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Message body */}
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            msg.isSelf
                              ? "bg-[#00A86B] text-white rounded-tr-xs"
                              : "bg-white text-[#111827] border border-[#ECEEF2] rounded-tl-xs"
                          }`}
                        >
                          {/* Priority badge if urgent */}
                          {msg.priority === "URGENT" && (
                            <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold text-[10px]">
                              <ShieldAlert className="w-3 h-3" />
                              <span>URGENT FLOOR ALERT</span>
                            </div>
                          )}

                          {msg.priority === "ANNOUNCEMENT" && (
                            <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                              <Sparkles className="w-3 h-3" />
                              <span>OFFICIAL ANNOUNCEMENT</span>
                            </div>
                          )}

                          <div className="whitespace-pre-wrap break-words">{msg.message}</div>

                          {/* Linked Order chip */}
                          {msg.orderNumber && (
                            <div className="mt-2.5 pt-2 border-t border-black/10 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold opacity-90">
                                Linked Order #{msg.orderNumber}
                              </span>
                              <Link
                                href={`/ops/orders?search=${msg.orderNumber}`}
                                className={`text-[10px] font-bold underline flex items-center gap-1 ${
                                  msg.isSelf ? "text-white" : "text-[#00A86B]"
                                }`}
                              >
                                <span>Inspect</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="p-3.5 bg-white border-t border-[#ECEEF2] shrink-0 space-y-2">
              {/* Optional Active Tag Bar */}
              {(orderTagInput || priority !== "NORMAL") && (
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {orderTagInput && (
                    <span className="px-2 py-0.5 rounded-md bg-[#E6F7F0] text-[#00A86B] font-bold text-[11px] flex items-center gap-1">
                      <span>Order #{orderTagInput}</span>
                      <button
                        type="button"
                        onClick={() => setOrderTagInput("")}
                        className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {priority !== "NORMAL" && (
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 ${
                        priority === "URGENT" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      <span>{priority}</span>
                      <button
                        type="button"
                        onClick={() => setPriority("NORMAL")}
                        className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Text Input & Controls */}
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <div className="flex-1 bg-[#F4F6F9] border border-[#ECEEF2] rounded-2xl p-2.5 flex flex-col focus-within:border-[#00A86B] focus-within:bg-white transition-all">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message #${CHANNELS.find((c) => c.id === activeChannel)?.name || activeChannel}... (Press Enter to send)`}
                    rows={2}
                    className="w-full bg-transparent text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-hidden resize-none"
                  />

                  {/* Toolbar Row */}
                  <div className="flex items-center justify-between pt-1 mt-1 border-t border-[#ECEEF2]/60">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const tag = prompt("Enter Order Number to tag (e.g. 1048):");
                          if (tag) setOrderTagInput(tag.replace(/#/g, ""));
                        }}
                        className="px-2 py-1 rounded-md text-[10px] font-semibold text-[#4B5563] hover:text-[#111827] hover:bg-[#E5E8ED] transition-colors cursor-pointer"
                      >
                        # Tag Order
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPriority((p) => (p === "URGENT" ? "NORMAL" : "URGENT"))
                        }
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                          priority === "URGENT"
                            ? "bg-red-100 text-red-700"
                            : "text-[#4B5563] hover:bg-[#E5E8ED]"
                        }`}
                      >
                        ⚠️ Mark Urgent
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPriority((p) => (p === "ANNOUNCEMENT" ? "NORMAL" : "ANNOUNCEMENT"))
                        }
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                          priority === "ANNOUNCEMENT"
                            ? "bg-amber-100 text-amber-800"
                            : "text-[#4B5563] hover:bg-[#E5E8ED]"
                        }`}
                      >
                        📢 Announcement
                      </button>
                    </div>

                    <span className="text-[10px] text-[#9CA3AF]">Shift+Enter for newline</span>
                  </div>
                </div>

                <OpsButton
                  type="submit"
                  variant="primary"
                  size="md"
                  className="h-12 w-12 rounded-2xl! p-0! shrink-0 justify-center items-center shadow-md shadow-[#00A86B]/20"
                  isLoading={isSending}
                >
                  <Send className="w-4 h-4" />
                </OpsButton>
              </form>
            </div>
          </div>
        </div>
      </div>
    </OpsLayout>
  );
}
