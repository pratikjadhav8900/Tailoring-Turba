"use client";

import React, { useState } from "react";
import {
  Check,
  Building2,
  FileText,
  IndianRupee,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import type { OpsTaskItem } from "@/types/ops";

interface PunchDoneModalProps {
  task: OpsTaskItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isPunchingOnBehalf?: boolean;
}

export const PunchDoneModal: React.FC<PunchDoneModalProps> = ({
  task,
  isOpen,
  onClose,
  onSuccess,
  isPunchingOnBehalf = false,
}) => {
  const [vendorName, setVendorName] = useState("");
  const [vendorCost, setVendorCost] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/ops/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          notes: notes.trim() || undefined,
          vendorName: vendorName.trim() || undefined,
          vendorCost: vendorCost ? Number(vendorCost) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to complete task.");
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError("An unexpected error occurred while completing task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 border-b border-[#ECEEF2] flex items-center justify-between ${isPunchingOnBehalf ? "bg-amber-50/60" : "bg-emerald-50/50"}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${isPunchingOnBehalf ? "bg-amber-600" : "bg-emerald-600"} text-white flex items-center justify-center shadow-xs`}>
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111827]">
                {isPunchingOnBehalf ? `Punch on Behalf — ${task.title}` : `Punch Done — ${task.title}`}
              </h4>
              <p className="text-[11px] text-[#00A86B] font-semibold">
                Order {task.formattedOrderNumber} • {task.orderTotalPieces || "Garment"} pcs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">
              {error}
            </div>
          )}

          {isPunchingOnBehalf && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Punching on Behalf</span>
                <span className="text-[11px] leading-relaxed">
                  You are recording completion on behalf of assigned worker <strong>{task.employeeName}</strong>. This will be audited in the timeline.
                </span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-1">
            <span className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider block">
              Instructions Given by Management:
            </span>
            <p className="text-xs text-[#1F2937] italic">
              {task.instructions || "No special instructions provided."}
            </p>
          </div>

          {/* Optional Vendor Details */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#00A86B]" />
                <span>Vendor / Job-Worker Details (Optional)</span>
              </label>
              <span className="text-[10px] font-semibold text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                Optional
              </span>
            </div>

            <div>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Sharma Embroidery, Om Sai Screen Print, Mill name..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs text-[#111827] focus:border-[#00A86B] outline-none"
              />
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold text-[#6B7280]">₹</span>
              <input
                type="number"
                min="0"
                value={vendorCost}
                onChange={(e) => setVendorCost(e.target.value)}
                placeholder="Job-work cost / challan amount (Optional ₹)"
                className="w-full pl-7 pr-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs text-[#111827] focus:border-[#00A86B] outline-none"
              />
            </div>
          </div>

          {/* Optional Completion Notes */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Completion Notes / Remarks (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Embroidery completed with 50 pcs in golden yellow thread. Ready for next step."
              className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs text-[#111827] focus:border-[#00A86B] outline-none resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECEEF2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Punching Done...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm & Punch Done</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
