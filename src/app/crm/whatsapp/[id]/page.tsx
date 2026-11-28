"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CrmLayout } from "@/components/crm/layout/CrmLayout";
import type { CrmWhatsAppBroadcast } from "@/types/crm";
import toast from "react-hot-toast";
import { ArrowLeft, Send, CheckCircle2, Clock, XCircle, Eye } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-[#F4F6F9] text-[#6B7280] border-[#E5E8ED]",
  SENT: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  DELIVERED: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
  READ: "bg-[#F3E8FF] text-[#7C3AED] border-[#E9D5FF]",
  FAILED: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
};

const BROADCAST_STATUS_STYLES: Record<string, string> = {
  SENDING: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  SENT: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
  PARTIAL: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  FAILED: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
};

export default function WhatsAppBroadcastDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [broadcast, setBroadcast] = useState<CrmWhatsAppBroadcast | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [sendingMore, setSendingMore] = useState(false);

  const fetchBroadcast = useCallback(async () => {
    const res = await fetch(`/api/crm/whatsapp/broadcasts/${params.id}`);
    if (!res.ok) {
      toast.error("Broadcast not found");
      router.push("/crm/whatsapp");
      return;
    }
    const data = await res.json();
    setBroadcast(data.broadcast);
    setStatusCounts(data.statusCounts || {});
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    fetchBroadcast();
  }, [fetchBroadcast]);

  const handleSendMore = async () => {
    setSendingMore(true);
    try {
      const res = await fetch(`/api/crm/whatsapp/broadcasts/${params.id}/process`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send more");
      toast.success(`Sent ${data.sent}, failed ${data.failed}`);
      fetchBroadcast();
    } catch (err: any) {
      toast.error(err.message || "Failed to send more");
    } finally {
      setSendingMore(false);
    }
  };

  if (loading || !broadcast) {
    return (
      <CrmLayout pageTitle="Broadcast">
        <div className="text-sm text-[#9CA3AF]">Loading...</div>
      </CrmLayout>
    );
  }

  const pendingCount = statusCounts.PENDING || 0;

  return (
    <CrmLayout
      pageTitle={broadcast.name}
      pageSubtitle={`Template: ${broadcast.templateName}`}
      headerAction={
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/crm/whatsapp")}
            className="h-9 px-3.5 rounded-full bg-white border border-[#ECEEF2] text-[#4B5563] hover:text-[#111827] text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          {pendingCount > 0 && (
            <button
              onClick={handleSendMore}
              disabled={sendingMore}
              className="h-9 px-4 rounded-full bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {sendingMore ? "Sending..." : `Send more now (${pendingCount} left)`}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${BROADCAST_STATUS_STYLES[broadcast.status]}`}>
              {broadcast.status}
            </span>
            <span className="text-xs text-[#9CA3AF]">{broadcast.recipientCount} total recipients</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {["PENDING", "SENT", "DELIVERED", "READ", "FAILED"].map((s) => (
              <div key={s} className={`p-3 rounded-xl text-center border ${STATUS_STYLES[s]}`}>
                <div className="text-lg font-bold">{statusCounts[s] || 0}</div>
                <div className="text-[10px] font-semibold uppercase">{s}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#ECEEF2] rounded-2xl divide-y divide-[#F3F4F6]">
          {(broadcast.recipients || []).map((r) => {
            const icon =
              r.status === "FAILED" ? (
                <XCircle className="w-4 h-4 text-[#DC2626]" />
              ) : r.status === "READ" ? (
                <Eye className="w-4 h-4 text-[#7C3AED]" />
              ) : r.status === "DELIVERED" || r.status === "SENT" ? (
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              ) : (
                <Clock className="w-4 h-4 text-[#9CA3AF]" />
              );
            return (
              <div key={r.id} className="flex items-center gap-3 p-3.5">
                {icon}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#111827]">{r.name}</div>
                  <div className="text-[11px] text-[#9CA3AF]">{r.phone}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[r.status]}`}>
                  {r.status}
                </span>
                {r.errorMessage && <span className="text-[11px] text-[#DC2626] max-w-xs truncate">{r.errorMessage}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </CrmLayout>
  );
}
