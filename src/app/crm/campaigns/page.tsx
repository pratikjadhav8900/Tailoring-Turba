"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CrmLayout } from "@/components/crm/layout/CrmLayout";
import type { CrmEmailCampaign } from "@/types/crm";
import toast from "react-hot-toast";
import { Plus, Mail, Users, Send, Clock, AlertCircle } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[#F4F6F9] text-[#6B7280] border-[#E5E8ED]",
  SENDING: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  SENT: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
  FAILED: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CrmEmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/campaigns");
      if (!res.ok) throw new Error("Failed to load campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSendDraft = async (id: string) => {
    if (!confirm("Send this campaign now?")) return;
    setSendingId(id);
    try {
      const res = await fetch(`/api/crm/campaigns/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send campaign");
      toast.success("Campaign sent");
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Failed to send campaign");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <CrmLayout
      pageTitle="Campaigns"
      pageSubtitle="Bulk & promotional email, sent through Resend"
      headerAction={
        <button
          onClick={() => router.push("/crm/campaigns/new")}
          className="h-9 px-4 rounded-full bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          New Campaign
        </button>
      }
    >
      {loading ? (
        <div className="text-center text-xs text-[#9CA3AF] py-12">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#ECEEF2] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FFF1EB] text-[#FF6A39] mx-auto flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No campaigns yet</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            Send a bulk or promotional email to your leads and customers in one go.
          </p>
          <Link
            href="/crm/campaigns/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#ECEEF2] rounded-2xl divide-y divide-[#F3F4F6]">
          {campaigns.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4">
              <div className="w-9 h-9 rounded-xl bg-[#FFF1EB] text-[#FF6A39] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#111827] truncate">{c.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#9CA3AF] flex-wrap">
                  <span className="truncate">{c.subject}</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {c.recipientCount} recipients
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {c.sentAt
                      ? `Sent ${new Date(c.sentAt).toLocaleString("en-IN")}`
                      : `Created ${new Date(c.createdAt).toLocaleString("en-IN")}`}
                  </span>
                  {c.createdBy && <span>· by {c.createdBy.name}</span>}
                </div>
                {c.status === "FAILED" && c.errorMessage && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[#DC2626]">
                    <AlertCircle className="w-3 h-3" />
                    {c.errorMessage}
                  </div>
                )}
              </div>
              {c.status === "DRAFT" && (
                <button
                  onClick={() => handleSendDraft(c.id)}
                  disabled={sendingId === c.id}
                  className="px-3.5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingId === c.id ? "Sending..." : "Send Now"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </CrmLayout>
  );
}
