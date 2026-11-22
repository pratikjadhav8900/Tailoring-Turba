"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CrmLayout } from "@/components/crm/layout/CrmLayout";
import { LeadStatusBadge } from "@/components/crm/ui/LeadStatusBadge";
import { LeadQualityBadge } from "@/components/crm/ui/LeadQualityBadge";
import { LeadScoreBar } from "@/components/crm/ui/LeadScoreBar";
import { AddLeadModal } from "@/components/crm/leads/AddLeadModal";
import { ImportLeadsModal } from "@/components/crm/leads/ImportLeadsModal";
import { AdvancedFiltersDrawer, EMPTY_FILTERS } from "@/components/crm/leads/AdvancedFiltersDrawer";
import type { AdvancedFilters } from "@/components/crm/leads/AdvancedFiltersDrawer";
import { LEAD_SOURCE_LABELS, LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "@/types/crm";
import type { CrmLead, CrmEmployee } from "@/types/crm";
import toast from "react-hot-toast";
import {
  Search,
  SlidersHorizontal,
  Upload,
  Download,
  Plus,
  Star,
  Trash2,
  Tag,
  ListChecks,
} from "lucide-react";

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "favourite", label: "Favourite" },
  { key: "new", label: "New" },
  { key: "assigned-to-me", label: "Assigned to me" },
  { key: "overdue", label: "Overdue" },
  { key: "hot", label: "Hot" },
];

function exportLeadsToCsv(leads: CrmLead[]) {
  const headers = ["Name", "Phone", "Email", "Company", "Stage", "Source", "Score", "Product Category", "Expected Value", "Assigned To", "Created At"];
  const rows = leads.map((l) => [
    l.name,
    l.phone || "",
    l.email || "",
    l.companyName || "",
    LEAD_STAGE_LABELS[l.status] || l.status,
    l.source,
    String(l.score),
    l.productCategory || "",
    l.expectedValue != null ? String(l.expectedValue) : "",
    l.assignedTo?.name || "",
    new Date(l.createdAt).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function countActiveFilters(f: AdvancedFilters) {
  return (
    f.statuses.length +
    f.sources.length +
    (f.quality ? 1 : 0) +
    (f.assignedToId ? 1 : 0) +
    (f.dateFrom ? 1 : 0) +
    (f.dateTo ? 1 : 0) +
    (f.minQuantity ? 1 : 0) +
    (f.minExpectedValue ? 1 : 0) +
    (f.noActivityDays ? 1 : 0)
  );
}

export default function CrmLeadsPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [salesReps, setSalesReps] = useState<CrmEmployee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab, page: String(page), limit: "25" });
      if (search.trim()) params.set("search", search.trim());
      filters.statuses.forEach((s) => params.append("statuses", s));
      filters.sources.forEach((s) => params.append("sources", s));
      if (filters.quality) params.set("quality", filters.quality);
      if (filters.assignedToId) params.set("assignedToId", filters.assignedToId);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.minQuantity) params.set("minQuantity", filters.minQuantity);
      if (filters.minExpectedValue) params.set("minExpectedValue", filters.minExpectedValue);
      if (filters.noActivityDays) params.set("noActivityDays", filters.noActivityDays);

      const res = await fetch(`/api/crm/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load leads");
      const data = await res.json();
      setLeads(data.leads || []);
      setTotalCount(data.pagination?.totalCount || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setSelected(new Set());
    } catch (err: any) {
      toast.error(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetch("/api/crm/employees")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSalesReps(d.employees || []));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, search, filters]);

  const toggleSelectAll = () => {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map((l) => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulkAction = async (action: string, value?: string | boolean) => {
    if (selected.size === 0) return;
    try {
      const res = await fetch("/api/crm/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: Array.from(selected), action, value }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Bulk action failed");
      toast.success("Updated selected leads");
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message || "Bulk action failed");
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selected.size} lead(s)? This cannot be undone.`)) return;
    await runBulkAction("delete");
  };

  const activeFilterCount = countActiveFilters(filters);

  return (
    <CrmLayout
      pageTitle={`Leads`}
      pageSubtitle={`${totalCount} total in pipeline`}
      headerAction={
        <div className="flex items-center gap-2">
          <Link
            href="/crm/tasks"
            className="h-9 px-3.5 rounded-full bg-white border border-[#ECEEF2] hover:border-[#D1D5DB] text-[#4B5563] hover:text-[#111827] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <ListChecks className="w-3.5 h-3.5" />
            Tasks
          </Link>
          <button
            onClick={() => setShowImportModal(true)}
            className="h-9 px-3.5 rounded-full bg-white border border-[#ECEEF2] hover:border-[#D1D5DB] text-[#4B5563] hover:text-[#111827] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={() => exportLeadsToCsv(leads)}
            className="h-9 px-3.5 rounded-full bg-white border border-[#ECEEF2] hover:border-[#D1D5DB] text-[#4B5563] hover:text-[#111827] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-9 px-4 rounded-full bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Lead
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[#ECEEF2] overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? "border-[#FF6A39] text-[#111827]"
                  : "border-transparent text-[#9CA3AF] hover:text-[#4B5563]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + filter row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email, company, lead ID..."
              className="w-full bg-white border border-[#E5E8ED] rounded-xl pl-9 pr-3 py-2 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none"
            />
          </div>
          <button
            onClick={() => setShowFiltersDrawer(true)}
            className={`relative h-9 px-3.5 rounded-xl bg-white border flex items-center gap-1.5 text-xs font-semibold transition-all ${
              activeFilterCount > 0 ? "border-[#FF6A39] text-[#FF6A39]" : "border-[#ECEEF2] text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FF6A39] text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs font-semibold text-[#9CA3AF] hover:text-[#111827]">
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-[#ECEEF2] rounded-2xl overflow-x-auto">
          <table className="crm-clean-table min-w-[1200px]">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && selected.size === leads.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[#D1D5DB] text-[#FF6A39] focus:ring-[#FF6A39] cursor-pointer"
                  />
                </th>
                <th>Customer</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Stage</th>
                <th>Quality</th>
                <th>Owner</th>
                <th>Source</th>
                <th>Interested In</th>
                <th>Expected Value</th>
                <th>Next Follow-up</th>
                <th>Score</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={12} className="text-center text-xs text-[#9CA3AF] py-8">
                    Loading leads...
                  </td>
                </tr>
              )}
              {!loading && leads.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center text-xs text-[#9CA3AF] py-8">
                    No leads found.
                  </td>
                </tr>
              )}
              {!loading &&
                leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="w-4 h-4 rounded border-[#D1D5DB] text-[#FF6A39] focus:ring-[#FF6A39] cursor-pointer"
                      />
                    </td>
                    <td>
                      <Link href={`/crm/leads/${lead.id}`} className="flex items-center gap-1.5 font-semibold text-[#111827] hover:text-[#FF6A39]">
                        {lead.isFavourite && <Star className="w-3 h-3 text-[#FF6A39] fill-[#FF6A39]" />}
                        {lead.name}
                      </Link>
                      {lead.openTaskCount != null && lead.openTaskCount > 0 && (
                        <span className="text-[10px] text-[#9CA3AF]">{lead.openTaskCount} open task{lead.openTaskCount > 1 ? "s" : ""}</span>
                      )}
                    </td>
                    <td className="text-[#6B7280]">{lead.companyName || "—"}</td>
                    <td className="text-[#6B7280]">
                      <div>{lead.phone || "—"}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{lead.email || ""}</div>
                    </td>
                    <td>
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td>
                      <LeadQualityBadge score={lead.score} />
                    </td>
                    <td className="text-[#6B7280]">{lead.assignedTo?.name || "Unassigned"}</td>
                    <td className="text-[#6B7280]">{LEAD_SOURCE_LABELS[lead.source] || lead.source}</td>
                    <td className="text-[#6B7280]">
                      {lead.productCategory || "—"}
                      {lead.quantity ? <span className="text-[11px] text-[#9CA3AF]"> ({lead.quantity} pcs)</span> : null}
                    </td>
                    <td className="text-[#6B7280]">{lead.expectedValue ? `₹${lead.expectedValue.toLocaleString("en-IN")}` : "—"}</td>
                    <td className="text-[#6B7280]">{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <LeadScoreBar score={lead.score} />
                    </td>
                    <td className="text-[#6B7280]">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4B5563] bg-white border border-[#ECEEF2] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-[#9CA3AF]">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4B5563] bg-white border border-[#ECEEF2] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Floating bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#111827] text-white rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-1.5 flex-wrap justify-center max-w-[95vw]">
          <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-full mr-1">
            Selected: {selected.size}
          </span>
          <select
            onChange={(e) => e.target.value && runBulkAction("assign", e.target.value)}
            defaultValue=""
            className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border-none outline-none cursor-pointer"
          >
            <option value="" disabled>
              Assign to
            </option>
            {salesReps.map((rep) => (
              <option key={rep.id} value={rep.id} className="text-black">
                {rep.name}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => e.target.value && runBulkAction("status", e.target.value)}
            defaultValue=""
            className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border-none outline-none cursor-pointer"
          >
            <option value="" disabled>
              Set stage
            </option>
            {LEAD_STAGE_ORDER.map((s) => (
              <option key={s} value={s} className="text-black">
                {LEAD_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            onClick={() => runBulkAction("favourite", true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            Favourite
          </button>
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-red-300 hover:bg-white/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}

      <AddLeadModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onCreated={fetchLeads} salesReps={salesReps} />
      <ImportLeadsModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImported={fetchLeads} salesReps={salesReps} />
      <AdvancedFiltersDrawer
        isOpen={showFiltersDrawer}
        onClose={() => setShowFiltersDrawer(false)}
        filters={filters}
        onApply={setFilters}
        salesReps={salesReps}
      />
    </CrmLayout>
  );
}
