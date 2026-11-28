"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CrmLayout } from "@/components/crm/layout/CrmLayout";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER, LEAD_SOURCE_LABELS } from "@/types/crm";
import type { LeadSource, LeadStage, WhatsAppAudienceFilter, WhatsAppTemplateOption } from "@/types/crm";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

const LEAD_SOURCES = Object.keys(LEAD_SOURCE_LABELS) as LeadSource[];
const LEAD_NAME_TOKEN = "{{lead_name}}";

const inputCls =
  "w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none";

export default function NewWhatsAppBroadcastPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WhatsAppTemplateOption[]>([]);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const [name, setName] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [variableValues, setVariableValues] = useState<string[]>([]);
  const [variablePersonalized, setVariablePersonalized] = useState<boolean[]>([]);

  const [filter, setFilter] = useState<WhatsAppAudienceFilter>({ leadStages: [], leadSources: [] });
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/crm/whatsapp/templates")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load templates");
        setTemplates(d.templates || []);
      })
      .catch((e) => setTemplatesError(e.message))
      .finally(() => setTemplatesLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPreviewLoading(true);
    fetch("/api/crm/whatsapp/broadcasts/preview-audience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filter),
    })
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d) => !cancelled && setPreviewCount(d.count ?? 0))
      .finally(() => !cancelled && setPreviewLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const selectedTemplate = templates.find((t) => `${t.name}::${t.language}` === selectedKey);

  const handleSelectTemplate = (key: string) => {
    setSelectedKey(key);
    const t = templates.find((tpl) => `${tpl.name}::${tpl.language}` === key);
    const count = t?.bodyVariableCount || 0;
    setVariableValues(Array.from({ length: count }, () => ""));
    setVariablePersonalized(Array.from({ length: count }, () => false));
  };

  const toggleStage = (stage: LeadStage) => {
    setFilter((f) => {
      const current = f.leadStages || [];
      return { ...f, leadStages: current.includes(stage) ? current.filter((s) => s !== stage) : [...current, stage] };
    });
  };

  const toggleSource = (source: LeadSource) => {
    setFilter((f) => {
      const current = f.leadSources || [];
      return { ...f, leadSources: current.includes(source) ? current.filter((s) => s !== source) : [...current, source] };
    });
  };

  const submit = async () => {
    if (!name.trim() || !selectedTemplate) {
      toast.error("Name and template are required.");
      return;
    }
    if (variableValues.some((v, i) => !variablePersonalized[i] && !v.trim())) {
      toast.error("Fill in every template variable, or mark it to use the lead's name.");
      return;
    }
    if (!previewCount) {
      toast.error("No recipients match this audience filter.");
      return;
    }
    if (!confirm(`Send this WhatsApp template to ${previewCount} leads now? This cannot be undone.`)) return;

    setSubmitting(true);
    try {
      const variables = variableValues.map((v, i) => (variablePersonalized[i] ? LEAD_NAME_TOKEN : v.trim()));
      const res = await fetch("/api/crm/whatsapp/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          templateName: selectedTemplate.name,
          templateLanguage: selectedTemplate.language,
          templateCategory: selectedTemplate.category,
          variables,
          audienceFilter: filter,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create broadcast");
      toast.success(`Sending started — ${data.firstBatch?.sent ?? 0} sent so far`);
      router.push(`/crm/whatsapp/${data.broadcast.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create broadcast");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CrmLayout
      pageTitle="New WhatsApp Broadcast"
      pageSubtitle="Template-based send via Meta WhatsApp Cloud API"
      headerAction={
        <button
          onClick={() => router.push("/crm/whatsapp")}
          className="h-9 px-3.5 rounded-full bg-white border border-[#ECEEF2] text-[#4B5563] hover:text-[#111827] text-xs font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      }
    >
      {templatesLoading ? (
        <div className="text-center text-xs text-[#9CA3AF] py-12">Loading templates...</div>
      ) : templatesError ? (
        <div className="p-8 rounded-2xl bg-white border border-[#ECEEF2] max-w-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-bold">WhatsApp isn&rsquo;t connected yet</h3>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed">{templatesError}</p>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            You&rsquo;ll need a Meta Business/WhatsApp Business Account, a verified phone number, and at least one
            APPROVED message template before this page can do anything — set it up in Meta Business Manager, then
            add the credentials to your environment variables (see <code>.env.example</code>).
          </p>
        </div>
      ) : templates.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-[#ECEEF2] max-w-xl">
          <p className="text-xs text-[#6B7280]">
            WhatsApp is connected, but there are no APPROVED message templates yet. Create and submit one in Meta
            Business Manager — approval usually takes about a day.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5 space-y-3">
              <input
                className={inputCls}
                placeholder="Broadcast name (internal)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <select className={inputCls} value={selectedKey} onChange={(e) => handleSelectTemplate(e.target.value)}>
                <option value="">Select an approved template...</option>
                {templates.map((t) => (
                  <option key={`${t.name}::${t.language}`} value={`${t.name}::${t.language}`}>
                    {t.name} ({t.language}) · {t.category}
                  </option>
                ))}
              </select>

              {selectedTemplate && variableValues.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-[#ECEEF2]">
                  <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Template variables</span>
                  {variableValues.map((value, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#6B7280] w-10 shrink-0">{`{{${i + 1}}}`}</span>
                      <input
                        className={inputCls}
                        disabled={variablePersonalized[i]}
                        placeholder={variablePersonalized[i] ? "Lead's name" : "Value for every recipient"}
                        value={variablePersonalized[i] ? "" : value}
                        onChange={(e) =>
                          setVariableValues((vals) => vals.map((v, idx) => (idx === i ? e.target.value : v)))
                        }
                      />
                      <label className="flex items-center gap-1 text-[11px] text-[#6B7280] shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={variablePersonalized[i]}
                          onChange={(e) =>
                            setVariablePersonalized((vals) => vals.map((v, idx) => (idx === i ? e.target.checked : v)))
                          }
                        />
                        Use lead's name
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-[#111827] uppercase">Audience (Leads only)</h3>
              <div>
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase block mb-1.5">
                  Stage (none checked = all)
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
                  Source (none checked = all)
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
              <p className="text-[11px] text-[#9CA3AF]">Leads marked WhatsApp opt-out are always excluded.</p>
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
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">leads with a valid, opted-in phone number</p>
                </>
              )}
            </div>

            <button
              onClick={submit}
              disabled={submitting || !previewCount || !selectedTemplate}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-sm font-bold disabled:opacity-50"
            >
              {submitting ? "Working..." : `Send Now to ${previewCount ?? 0} leads`}
            </button>
          </div>
        </div>
      )}
    </CrmLayout>
  );
}
