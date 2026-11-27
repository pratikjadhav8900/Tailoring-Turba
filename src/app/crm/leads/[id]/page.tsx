"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CrmLayout } from "@/components/crm/layout/CrmLayout";
import { LeadStatusBadge } from "@/components/crm/ui/LeadStatusBadge";
import { LeadQualityBadge } from "@/components/crm/ui/LeadQualityBadge";
import { LeadScoreBar } from "@/components/crm/ui/LeadScoreBar";
import { LeadTasksPanel } from "@/components/crm/leads/LeadTasksPanel";
import { LeadTagEditor } from "@/components/crm/leads/LeadTagEditor";
import { LEAD_SOURCE_LABELS, LEAD_STAGE_LABELS, LEAD_STAGE_ORDER, PRODUCT_CATEGORIES } from "@/types/crm";
import type { CrmLead, CrmEmployee, LeadStage } from "@/types/crm";
import toast from "react-hot-toast";
import {
  Phone,
  Mail,
  Building2,
  MapPin,
  Star,
  Trash2,
  ArrowLeft,
  PhoneCall,
  MessageCircle,
  MailPlus,
  Users as UsersIcon,
  CheckCircle2,
  Clock,
} from "lucide-react";

const ACTIVITY_TYPES = [
  { type: "NOTE", label: "Note", icon: <MessageCircle className="w-3.5 h-3.5" /> },
  { type: "CALL", label: "Call", icon: <PhoneCall className="w-3.5 h-3.5" /> },
  { type: "WHATSAPP", label: "WhatsApp", icon: <MessageCircle className="w-3.5 h-3.5" /> },
  { type: "EMAIL", label: "Email", icon: <MailPlus className="w-3.5 h-3.5" /> },
  { type: "MEETING", label: "Meeting", icon: <UsersIcon className="w-3.5 h-3.5" /> },
];

const TABS = ["Overview", "Activity", "Tasks", "Notes", "Audit History"] as const;
type Tab = (typeof TABS)[number];

function ActivityFeed({ items }: { items: NonNullable<CrmLead["activities"]> }) {
  if (items.length === 0) {
    return <div className="text-xs text-[#9CA3AF] text-center py-8">Nothing here yet.</div>;
  }
  return (
    <div className="space-y-3">
      {items.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-[#FFF1EB] text-[#FF6A39] flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0 pb-3 border-b border-[#F3F4F6]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#111827]">
                {activity.employeeName || "System"} · {activity.type.replace(/_/g, " ")}
              </span>
              <span className="text-[11px] text-[#9CA3AF] shrink-0">{new Date(activity.createdAt).toLocaleString()}</span>
            </div>
            {activity.note && <p className="text-sm text-[#4B5563] mt-1">{activity.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<CrmLead | null>(null);
  const [salesReps, setSalesReps] = useState<CrmEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [noteText, setNoteText] = useState("");
  const [activityType, setActivityType] = useState("NOTE");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [converting, setConverting] = useState(false);

  const fetchLead = useCallback(async () => {
    const res = await fetch(`/api/crm/leads/${params.id}`);
    if (!res.ok) {
      toast.error("Lead not found");
      router.push("/crm/leads");
      return;
    }
    const data = await res.json();
    setLead(data.lead);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  useEffect(() => {
    fetch("/api/crm/employees")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSalesReps(d.employees || []));
  }, []);

  const patchLead = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/crm/leads/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error((await res.json()).error || "Update failed");
      return;
    }
    fetchLead();
  };

  const handleStatusChange = (value: LeadStage) => {
    patchLead({ status: value });
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/crm/leads/${params.id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activityType, note: noteText.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to log activity");
      setNoteText("");
      fetchLead();
    } catch (err: any) {
      toast.error(err.message || "Failed to log activity");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleConvert = async () => {
    if (!confirm("Convert this lead into a customer account?")) return;
    // Without this guard, a double-click (or a slow connection) could fire two convert
    // requests before the lead's convertedUserId was set, each creating its own User.
    if (converting) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/crm/leads/${params.id}/convert`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Conversion failed");
        return;
      }
      toast.success("Lead converted to customer");
      fetchLead();
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this lead permanently?")) return;
    const res = await fetch(`/api/crm/leads/${params.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete lead");
      return;
    }
    toast.success("Lead deleted");
    router.push("/crm/leads");
  };

  if (loading || !lead) {
    return (
      <CrmLayout pageTitle="Lead Details">
        <div className="text-sm text-[#9CA3AF]">Loading lead...</div>
      </CrmLayout>
    );
  }

  const activities = lead.activities || [];
  const notes = activities.filter((a) => a.type === "NOTE");
  const audit = activities.filter((a) => a.type === "STATUS_CHANGE" || a.type === "ASSIGNED" || a.type === "CONVERTED" || a.type === "IMPORTED");

  return (
    <CrmLayout
      pageTitle={lead.name}
      pageSubtitle={lead.companyName || "Lead Details"}
      headerAction={
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/crm/leads")}
            className="h-9 px-3.5 rounded-full bg-white border border-[#ECEEF2] text-[#4B5563] hover:text-[#111827] text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          {!lead.convertedUserId && lead.status === "CONVERTED" && (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="h-9 px-4 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {converting ? "Converting…" : "Convert to Customer"}
            </button>
          )}
          <button onClick={handleDelete} className="w-9 h-9 rounded-full bg-white border border-[#ECEEF2] text-red-500 hover:bg-red-50 flex items-center justify-center">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Lead info (always visible) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#111827]">{lead.name}</h2>
                <button onClick={() => patchLead({ isFavourite: !lead.isFavourite })}>
                  <Star className={`w-4 h-4 ${lead.isFavourite ? "text-[#FF6A39] fill-[#FF6A39]" : "text-[#D1D5DB]"}`} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <LeadStatusBadge status={lead.status} />
              <LeadQualityBadge score={lead.score} />
            </div>

            <div className="mt-4">
              <LeadTagEditor leadId={lead.id} assignedTags={lead.tags || []} onChange={fetchLead} />
            </div>

            <div className="mt-4 space-y-2.5 text-sm">
              {lead.phone && (
                <div className="flex items-center gap-2 text-[#4B5563]">
                  <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <a href={`tel:${lead.phone}`} className="hover:text-[#FF6A39]">{lead.phone}</a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-[#4B5563]">
                  <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <a href={`mailto:${lead.email}`} className="hover:text-[#FF6A39]">{lead.email}</a>
                </div>
              )}
              {lead.companyName && (
                <div className="flex items-center gap-2 text-[#4B5563]">
                  <Building2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  {lead.companyName}
                </div>
              )}
              {lead.city && (
                <div className="flex items-center gap-2 text-[#4B5563]">
                  <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  {lead.city}
                </div>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-[#ECEEF2] space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">Stage</label>
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value as LeadStage)}
                  className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-xs font-semibold text-[#111827] focus:border-[#FF6A39] outline-none"
                >
                  {LEAD_STAGE_ORDER.map((s) => (
                    <option key={s} value={s}>{LEAD_STAGE_LABELS[s]}</option>
                  ))}
                </select>
                {lead.status === "NOT_INTERESTED" && lead.lostReason && (
                  <p className="text-[11px] text-[#DC2626] mt-1">Reason: {lead.lostReason}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">Assigned To</label>
                <select
                  value={lead.assignedToId || ""}
                  onChange={(e) => patchLead({ assignedToId: e.target.value || null })}
                  className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-xs font-semibold text-[#111827] focus:border-[#FF6A39] outline-none"
                >
                  <option value="">Unassigned</option>
                  {salesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">Score</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={lead.score}
                    onChange={(e) => patchLead({ score: Number(e.target.value) })}
                    className="flex-1 accent-[#FF6A39]"
                  />
                  <LeadScoreBar score={lead.score} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1">Next Follow-up</label>
                <input
                  type="date"
                  value={lead.nextFollowUpAt ? String(lead.nextFollowUpAt).slice(0, 10) : ""}
                  onChange={(e) => patchLead({ nextFollowUpAt: e.target.value || null })}
                  className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-xs font-semibold text-[#111827] focus:border-[#FF6A39] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5 space-y-2.5 text-sm">
            <h3 className="text-xs font-bold text-[#111827] uppercase mb-1">Lead Details</h3>
            <div className="flex justify-between text-[#4B5563]">
              <span className="text-[#9CA3AF]">Source</span>
              <span className="font-medium">{LEAD_SOURCE_LABELS[lead.source] || lead.source}</span>
            </div>
            {lead.sourceDetail && (
              <div className="flex justify-between text-[#4B5563]">
                <span className="text-[#9CA3AF]">Campaign</span>
                <span className="font-medium">{lead.sourceDetail}</span>
              </div>
            )}
            <div className="flex justify-between text-[#4B5563] items-center">
              <span className="text-[#9CA3AF]">Product Category</span>
              <select
                value={lead.productCategory || ""}
                onChange={(e) => patchLead({ productCategory: e.target.value || null })}
                className="font-medium text-right bg-transparent outline-none cursor-pointer"
              >
                <option value="">—</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {lead.quantity != null && (
              <div className="flex justify-between text-[#4B5563]">
                <span className="text-[#9CA3AF]">Quantity</span>
                <span className="font-medium">{lead.quantity} pcs</span>
              </div>
            )}
            <div className="flex justify-between text-[#4B5563] items-center">
              <span className="text-[#9CA3AF]">Expected Value</span>
              <input
                type="number"
                defaultValue={lead.expectedValue ?? ""}
                onBlur={(e) => patchLead({ expectedValue: e.target.value ? Number(e.target.value) : null })}
                placeholder="₹"
                className="font-medium text-right w-28 bg-transparent outline-none border-b border-dashed border-transparent focus:border-[#FF6A39]"
              />
            </div>
            <div className="flex justify-between text-[#4B5563]">
              <span className="text-[#9CA3AF]">Created</span>
              <span className="font-medium">{new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>
            {lead.requirements && (
              <div className="pt-2 border-t border-[#ECEEF2]">
                <span className="text-[#9CA3AF] block mb-1">Requirements</span>
                <p className="text-[#4B5563] leading-relaxed">{lead.requirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: tabbed workspace */}
        <div className="lg:col-span-2 bg-white border border-[#ECEEF2] rounded-2xl p-5">
          <div className="flex items-center gap-1 border-b border-[#ECEEF2] mb-5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === t ? "border-[#FF6A39] text-[#111827]" : "border-transparent text-[#9CA3AF] hover:text-[#4B5563]"
                }`}
              >
                {t}
                {t === "Tasks" && (lead.tasks || []).some((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED") && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[#FF6A39]" />
                )}
              </button>
            ))}
          </div>

          {activeTab === "Overview" && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-[#F8F9FB]">
                  <div className="text-[11px] text-[#9CA3AF] uppercase font-semibold">Last Contacted</div>
                  <div className="font-semibold text-[#111827] mt-1">
                    {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleString() : "Never"}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F9FB]">
                  <div className="text-[11px] text-[#9CA3AF] uppercase font-semibold">Open Tasks</div>
                  <div className="font-semibold text-[#111827] mt-1">
                    {(lead.tasks || []).filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#111827] uppercase mb-2">Recent Activity</h4>
                <ActivityFeed items={activities.slice(0, 5)} />
              </div>
            </div>
          )}

          {activeTab === "Activity" && (
            <div>
              <form onSubmit={handleAddActivity} className="mb-5 space-y-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ACTIVITY_TYPES.map((a) => (
                    <button
                      type="button"
                      key={a.type}
                      onClick={() => setActivityType(a.type)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        activityType === a.type ? "bg-[#FF6A39] text-white" : "bg-[#F4F6F9] text-[#6B7280] hover:bg-[#ECEEF2]"
                      }`}
                    >
                      {a.icon}
                      {a.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Log a call, note, or follow-up..."
                  rows={3}
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingNote || !noteText.trim()}
                    className="px-5 py-2 rounded-lg bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                  >
                    {submittingNote ? "Saving..." : "Add Activity"}
                  </button>
                </div>
              </form>
              <ActivityFeed items={activities} />
            </div>
          )}

          {activeTab === "Tasks" && (
            <LeadTasksPanel leadId={lead.id} tasks={lead.tasks || []} salesReps={salesReps} onChange={fetchLead} />
          )}

          {activeTab === "Notes" && <ActivityFeed items={notes} />}

          {activeTab === "Audit History" && <ActivityFeed items={audit} />}
        </div>
      </div>
    </CrmLayout>
  );
}
