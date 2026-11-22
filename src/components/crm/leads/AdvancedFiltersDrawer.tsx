"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER, LEAD_SOURCE_LABELS } from "@/types/crm";
import type { CrmEmployee } from "@/types/crm";

export interface AdvancedFilters {
  statuses: string[];
  sources: string[];
  quality: string;
  assignedToId: string;
  dateFrom: string;
  dateTo: string;
  minQuantity: string;
  minExpectedValue: string;
  noActivityDays: string;
}

export const EMPTY_FILTERS: AdvancedFilters = {
  statuses: [],
  sources: [],
  quality: "",
  assignedToId: "",
  dateFrom: "",
  dateTo: "",
  minQuantity: "",
  minExpectedValue: "",
  noActivityDays: "",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
  salesReps: CrmEmployee[];
}

const chipCls = (active: boolean) =>
  `px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
    active ? "bg-[#FF6A39] border-[#FF6A39] text-white" : "bg-white border-[#E5E8ED] text-[#6B7280] hover:border-[#FF6A39]"
  }`;

const inputCls =
  "w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none";

export const AdvancedFiltersDrawer: React.FC<Props> = ({ isOpen, onClose, filters, onApply, salesReps }) => {
  const [draft, setDraft] = useState<AdvancedFilters>(filters);

  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const toggleArrayValue = (key: "statuses" | "sources", value: string) => {
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white h-full shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEEF2] sticky top-0 bg-white z-10">
          <h2 className="text-sm font-bold text-[#111827]">Advanced Filters</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111827]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="text-xs font-semibold text-[#374151] mb-2">Lead Stage</div>
            <div className="flex flex-wrap gap-1.5">
              {LEAD_STAGE_ORDER.map((stage) => (
                <button key={stage} type="button" onClick={() => toggleArrayValue("statuses", stage)} className={chipCls(draft.statuses.includes(stage))}>
                  {LEAD_STAGE_LABELS[stage]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-[#374151] mb-2">Lead Quality</div>
            <div className="flex gap-1.5">
              {["HOT", "WARM", "COLD"].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, quality: d.quality === q ? "" : q }))}
                  className={chipCls(draft.quality === q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-[#374151] mb-2">Lead Source</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                <button key={value} type="button" onClick={() => toggleArrayValue("sources", value)} className={chipCls(draft.sources.includes(value))}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Lead Owner</label>
            <select className={inputCls} value={draft.assignedToId} onChange={(e) => setDraft((d) => ({ ...d, assignedToId: e.target.value }))}>
              <option value="">Any owner</option>
              <option value="unassigned">Unassigned</option>
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Created From</label>
              <input type="date" className={inputCls} value={draft.dateFrom} onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Created To</label>
              <input type="date" className={inputCls} value={draft.dateTo} onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Min. Quantity</label>
            <input type="number" min={0} className={inputCls} value={draft.minQuantity} onChange={(e) => setDraft((d) => ({ ...d, minQuantity: e.target.value }))} placeholder="e.g. 500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Min. Expected Value (₹)</label>
            <input type="number" min={0} className={inputCls} value={draft.minExpectedValue} onChange={(e) => setDraft((d) => ({ ...d, minExpectedValue: e.target.value }))} placeholder="e.g. 100000" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">No Activity In (days)</label>
            <input type="number" min={0} className={inputCls} value={draft.noActivityDays} onChange={(e) => setDraft((d) => ({ ...d, noActivityDays: e.target.value }))} placeholder="e.g. 7" />
          </div>
        </div>

        <div className="p-5 border-t border-[#ECEEF2] sticky bottom-0 bg-white flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY_FILTERS);
              onApply(EMPTY_FILTERS);
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#4B5563] hover:bg-[#F4F6F9]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="flex-1 px-4 py-2 rounded-lg bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs font-semibold"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
