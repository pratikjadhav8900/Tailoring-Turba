"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { LEAD_SOURCE_LABELS } from "@/types/crm";
import type { CrmEmployee } from "@/types/crm";

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  salesReps: CrmEmployee[];
}

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
  isOpen,
  onClose,
  onImported,
  salesReps,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [defaultSource, setDefaultSource] = useState("OLD_CUSTOMER_DATA");
  const [assignedToId, setAssignedToId] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; totalRows: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ""));
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText) {
      toast.error("Choose a CSV file first");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/crm/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText, defaultSource, defaultAssignedToId: assignedToId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
      toast.success(`Imported ${data.created} of ${data.totalRows} rows`);
      onImported();
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFileName("");
    setCsvText("");
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEEF2] sticky top-0 bg-white z-10">
          <h2 className="text-sm font-bold text-[#111827]">Import Leads (CSV)</h2>
          <button onClick={handleClose} className="text-[#9CA3AF] hover:text-[#111827]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Upload the owner&apos;s old customer list or any CSV with columns like{" "}
            <code className="bg-[#F4F6F9] px-1 rounded">name, phone, email, company, city, requirements, quantity</code>.
          </p>

          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-[#E5E8ED] hover:border-[#FF6A39] rounded-xl p-6 flex flex-col items-center gap-2 text-[#6B7280] hover:text-[#FF6A39] transition-colors"
          >
            {fileName ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
            <span className="text-xs font-semibold">{fileName || "Click to choose a CSV file"}</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Default Source</label>
              <select
                className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none"
                value={defaultSource}
                onChange={(e) => setDefaultSource(e.target.value)}
              >
                {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Assign To</label>
              <select
                className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {result && (
            <div className="rounded-xl border border-[#ECEEF2] p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#059669] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {result.created} leads imported
              </div>
              {result.skipped > 0 && (
                <div className="flex items-center gap-1.5 text-[#D97706] font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {result.skipped} rows skipped
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="text-[#9CA3AF] max-h-24 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={handleClose} className="px-4 py-2 rounded-lg text-xs font-semibold text-[#4B5563] hover:bg-[#F4F6F9] transition-colors">
              Close
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || !csvText}
              className="px-5 py-2 rounded-lg bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import Leads"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
