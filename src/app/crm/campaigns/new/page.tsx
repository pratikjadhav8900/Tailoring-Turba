"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CrmLayout } from "@/components/crm/layout/CrmLayout";
import {
  LEAD_STAGE_LABELS,
  LEAD_STAGE_ORDER,
  LEAD_SOURCE_LABELS,
} from "@/types/crm";
import type { CampaignAudienceFilter, LeadSource, LeadStage } from "@/types/crm";
import { RESEND_UNSUBSCRIBE_TAG, DEFAULT_CAMPAIGN_FOOTER_HTML } from "@/lib/crm/campaign-constants";
import toast from "react-hot-toast";
import { ArrowLeft, Users, UserCheck, Loader2 } from "lucide-react";

const LEAD_SOURCES = Object.keys(LEAD_SOURCE_LABELS) as LeadSource[];

const DEFAULT_BODY_HTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color:#111827;">
  <h2 style="margin-bottom: 12px;">Hi there,</h2>
  <p style="line-height:1.6; color:#374151;">Write your message here...</p>
  <a href="https://tailoringturba.com" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#FF6A39;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Shop Now</a>
  ${DEFAULT_CAMPAIGN_FOOTER_HTML}
</div>`;

const inputCls =
  "w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none";

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState(DEFAULT_BODY_HTML);
  const [filter, setFilter] = useState<CampaignAudienceFilter>({
    includeLeads: true,
    leadStages: [],
    leadSources: [],
    includeCustomers: false,
  });
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewSample, setPreviewSample] = useState<{ name: string; email: string }[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPreviewLoading(true);
    fetch("/api/crm/campaigns/preview-audience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filter),
    })
      .then((r) => (r.ok ? r.json() : { count: 0, sample: [] }))
      .then((d) => {
        if (cancelled) return;
        setPreviewCount(d.count ?? 0);
        setPreviewSample(d.sample || []);
      })
      .finally(() => !cancelled && setPreviewLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const toggleStage = (stage: LeadStage) => {
    setFilter((f) => {
      const current = f.leadStages || [];
      const next = current.includes(stage) ? current.filter((s) => s !== stage) : [...current, stage];
      return { ...f, leadStages: next };
    });
  };

  const toggleSource = (source: LeadSource) => {
    setFilter((f) => {
      const current = f.leadSources || [];
      const next = current.includes(source) ? current.filter((s) => s !== source) : [...current, source];
      return { ...f, leadSources: next };
    });
  };

  const insertUnsubscribeTag = () => {
    if (bodyHtml.includes(RESEND_UNSUBSCRIBE_TAG)) {
      toast.error("Unsubscribe link is already in the body.");
      return;
    }
    setBodyHtml((html) => html + DEFAULT_CAMPAIGN_FOOTER_HTML);
  };

  const insertFirstName = () => {
    setBodyHtml((html) => html + " {{{contact.first_name|there}}}");
  };

  const submit = async (sendNow: boolean) => {
    if (!name.trim() || !subject.trim() || !bodyHtml.trim()) {
      toast.error("Name, subject, and body are required.");
      return;
    }
    if (!bodyHtml.includes(RESEND_UNSUBSCRIBE_TAG)) {
      toast.error('Add the unsubscribe link before sending — use "Insert unsubscribe link".');
      return;
    }
    if (!previewCount) {
      toast.error("No recipients match this audience filter.");
      return;
    }
    if (sendNow && !confirm(`Send this campaign to ${previewCount} recipients now? This cannot be undone.`)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/crm/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, bodyHtml, audienceFilter: filter, sendNow }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create campaign");
      toast.success(sendNow ? "Campaign sent" : "Campaign saved as draft");
      router.push("/crm/campaigns");
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CrmLayout
      pageTitle="New Campaign"
      pageSubtitle="Bulk & promotional email"
      headerAction={
        <button
          onClick={() => router.push("/crm/campaigns")}
          className="h-9 px-3.5 rounded-full bg-white border border-[#ECEEF2] text-[#4B5563] hover:text-[#111827] text-xs font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5 space-y-3">
            <input
              className={inputCls}
              placeholder="Campaign name (internal, e.g. 'Diwali Promo 2026')"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className={inputCls}
              placeholder="Email subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Email body (HTML)</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={insertFirstName} className="text-[11px] font-semibold text-[#FF6A39] hover:underline">
                    Insert first name
                  </button>
                  <button type="button" onClick={insertUnsubscribeTag} className="text-[11px] font-semibold text-[#FF6A39] hover:underline">
                    Insert unsubscribe link
                  </button>
                </div>
              </div>
              <textarea
                className={`${inputCls} font-mono text-xs`}
                rows={14}
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
              />
              {!bodyHtml.includes(RESEND_UNSUBSCRIBE_TAG) && (
                <p className="text-[11px] text-[#DC2626] mt-1">
                  No unsubscribe link in this email yet — required before sending.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-[#111827] uppercase mb-2">Preview</h3>
            <div
              className="border border-[#ECEEF2] rounded-xl p-4 bg-[#F8F9FB] max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#111827] uppercase">Audience</h3>

            <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] cursor-pointer">
              <input
                type="checkbox"
                checked={filter.includeLeads}
                onChange={(e) => setFilter((f) => ({ ...f, includeLeads: e.target.checked }))}
              />
              <Users className="w-3.5 h-3.5 text-[#FF6A39]" />
              Leads
            </label>
            {filter.includeLeads && (
              <div className="pl-5 space-y-3 border-l border-[#ECEEF2]">
                <div>
                  <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase block mb-1.5">
                    Stage (none checked = all stages)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {LEAD_STAGE_ORDER.map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => toggleStage(stage)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                          (filter.leadStages || []).includes(stage)
                            ? "bg-[#FF6A39] text-white border-[#FF6A39]"
                            : "bg-white text-[#6B7280] border-[#E5E8ED] hover:border-[#FF6A39]"
                        }`}
                      >
                        {LEAD_STAGE_LABELS[stage]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase block mb-1.5">
                    Source (none checked = all sources)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {LEAD_SOURCES.map((source) => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => toggleSource(source)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                          (filter.leadSources || []).includes(source)
                            ? "bg-[#FF6A39] text-white border-[#FF6A39]"
                            : "bg-white text-[#6B7280] border-[#E5E8ED] hover:border-[#FF6A39]"
                        }`}
                      >
                        {LEAD_SOURCE_LABELS[source]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] cursor-pointer">
              <input
                type="checkbox"
                checked={filter.includeCustomers}
                onChange={(e) => setFilter((f) => ({ ...f, includeCustomers: e.target.checked }))}
              />
              <UserCheck className="w-3.5 h-3.5 text-[#FF6A39]" />
              Existing customers
            </label>
          </div>

          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-[#111827] uppercase mb-2">Recipients</h3>
            {previewLoading ? (
              <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Calculating...
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-[#111827]">{previewCount ?? 0}</div>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">people will receive this email</p>
                {previewSample.length > 0 && (
                  <ul className="mt-3 space-y-1 text-[11px] text-[#6B7280]">
                    {previewSample.map((r) => (
                      <li key={r.email} className="truncate">
                        {r.name || r.email} · {r.email}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => submit(true)}
              disabled={submitting || !previewCount}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-sm font-bold disabled:opacity-50"
            >
              {submitting ? "Working..." : `Send Now to ${previewCount ?? 0} people`}
            </button>
            <button
              onClick={() => submit(false)}
              disabled={submitting || !previewCount}
              className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-[#374151] text-sm font-semibold hover:bg-[#F9FAFB] disabled:opacity-50"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </CrmLayout>
  );
}
