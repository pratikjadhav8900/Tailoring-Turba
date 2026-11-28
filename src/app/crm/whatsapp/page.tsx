"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CrmLayout } from "@/components/crm/layout/CrmLayout";
import type { CrmWhatsAppBroadcast } from "@/types/crm";
import toast from "react-hot-toast";
import { Plus, MessageCircle, Users, Clock } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  SENDING: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  SENT: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
  PARTIAL: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  FAILED: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
};

export default function WhatsAppBroadcastsPage() {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState<CrmWhatsAppBroadcast[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBroadcasts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/whatsapp/broadcasts");
      if (!res.ok) throw new Error("Failed to load broadcasts");
      const data = await res.json();
      setBroadcasts(data.broadcasts || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load broadcasts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  return (
    <CrmLayout
      pageTitle="WhatsApp"
      pageSubtitle="Template-based broadcasts via Meta WhatsApp Cloud API"
      headerAction={
        <button
          onClick={() => router.push("/crm/whatsapp/new")}
          className="h-9 px-4 rounded-full bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          New Broadcast
        </button>
      }
    >
      {loading ? (
        <div className="text-center text-xs text-[#9CA3AF] py-12">Loading broadcasts...</div>
      ) : broadcasts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#ECEEF2] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FFF1EB] text-[#FF6A39] mx-auto flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No broadcasts yet</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            Send a template-based WhatsApp message to a filtered list of leads.
          </p>
          <Link
            href="/crm/whatsapp/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Create your first broadcast
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#ECEEF2] rounded-2xl divide-y divide-[#F3F4F6]">
          {broadcasts.map((b) => (
            <Link
              key={b.id}
              href={`/crm/whatsapp/${b.id}`}
              className="flex items-center gap-4 p-4 hover:bg-[#F8F9FB] transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FFF1EB] text-[#FF6A39] flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#111827] truncate">{b.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[b.status]}`}>
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#9CA3AF] flex-wrap">
                  <span className="truncate">Template: {b.templateName}</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {b.recipientCount} recipients
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(b.createdAt).toLocaleString("en-IN")}
                  </span>
                  {b.createdBy && <span>· by {b.createdBy.name}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </CrmLayout>
  );
}
