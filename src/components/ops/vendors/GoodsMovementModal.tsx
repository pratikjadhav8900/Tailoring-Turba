"use client";

import React, { useState } from "react";
import {
  X,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  Calendar,
  FileText,
  AlertCircle,
  Building2,
} from "lucide-react";
import type { OpsExternalWorkAssignment } from "@/types/ops";

interface GoodsMovementModalProps {
  assignment: OpsExternalWorkAssignment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GoodsMovementModal: React.FC<GoodsMovementModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [movementType, setMovementType] = useState<"OUTWARD" | "INWARD">("INWARD");
  const [quantity, setQuantity] = useState<string>("");
  const [challanNumber, setChallanNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSent = assignment.quantitySent || 0;
  const currentReceived = assignment.quantityReceived || 0;
  const currentPending = Math.max(0, currentSent - currentReceived);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid positive quantity.");
      return;
    }

    if (movementType === "INWARD") {
      if (currentSent === 0) {
        setError("Cannot receive goods before any goods have been sent out (Outward Challan).");
        return;
      }
      if (qty > currentPending) {
        setError(
          `Received quantity (${qty}) cannot exceed currently pending quantity (${currentPending}).`
        );
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/ops/assignments/${assignment.id}/movement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movementType: movementType === "OUTWARD" ? "OUTWARD_CHALLAN" : "INWARD_RECEIPT",
          quantity: qty,
          challanNumber: challanNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record goods movement.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-[#ECEEF2] shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#ECEEF2] flex items-center justify-between bg-[#F8F9FB]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                Record Goods Movement
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Challan Outward & Inward Receiving Ledger
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Balance Summary Bar */}
        <div className="px-5 py-3 bg-[#F4F6F9] border-b border-[#ECEEF2] text-xs">
          <div className="flex items-center justify-between font-semibold text-[#111827] mb-2">
            <span className="flex items-center gap-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-[#00A86B]" />
              {assignment.vendorName}
              {assignment.vendorCode && (
                <span className="text-[10px] text-[#6B7280] font-mono bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                  {assignment.vendorCode}
                </span>
              )}
            </span>
            <span className="text-[10px] uppercase font-bold text-[#6B7280]">
              {assignment.stage.replace(/_/g, " ")}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-white border border-[#E5E7EB]">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-bold">
                Sent
              </span>
              <span className="text-sm font-extrabold text-[#111827]">
                {currentSent} <span className="text-[10px] font-normal text-[#6B7280]">{assignment.unit || "pcs"}</span>
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#E5E7EB]">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-bold">
                Received
              </span>
              <span className="text-sm font-extrabold text-[#00A86B]">
                {currentReceived} <span className="text-[10px] font-normal text-[#6B7280]">{assignment.unit || "pcs"}</span>
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#E5E7EB]">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-bold">
                Pending
              </span>
              <span
                className={`text-sm font-extrabold ${
                  currentPending > 0 ? "text-amber-600" : "text-[#9CA3AF]"
                }`}
              >
                {currentPending} <span className="text-[10px] font-normal text-[#6B7280]">{assignment.unit || "pcs"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Movement Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">
              Movement Direction <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMovementType("OUTWARD")}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  movementType === "OUTWARD"
                    ? "bg-[#111827] text-white border-[#111827] shadow-sm"
                    : "bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
                <span>Outward (Challan / Sent)</span>
              </button>
              <button
                type="button"
                onClick={() => setMovementType("INWARD")}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  movementType === "INWARD"
                    ? "bg-[#00A86B] text-white border-[#00A86B] shadow-sm"
                    : "bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-white" />
                <span>Inward (Received Back)</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                Quantity ({assignment.unit || "pcs"}) <span className="text-red-500">*</span>
              </label>
              {movementType === "INWARD" && currentPending > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantity(currentPending.toString())}
                  className="text-[11px] font-semibold text-[#00A86B] hover:underline cursor-pointer"
                >
                  Receive All ({currentPending})
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={
                  movementType === "INWARD"
                    ? `Max ${currentPending} ${assignment.unit || "pcs"}`
                    : "e.g. 100"
                }
                required
                className="w-full pl-3 pr-14 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[#9CA3AF] font-bold">
                {assignment.unit || "pcs"}
              </span>
            </div>
          </div>

          {/* Challan / DC Number */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1.5 uppercase tracking-wider">
              Challan / DC / Invoice # (Optional)
            </label>
            <input
              type="text"
              value={challanNumber}
              onChange={(e) => setChallanNumber(e.target.value)}
              placeholder="e.g. CH-2026/042 or INV-9912"
              className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
            />
          </div>

          {/* Notes / Discrepancy Comments */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1.5 uppercase tracking-wider">
              Inspection Notes / Discrepancy Comments (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received in good condition; 2 pcs rejected due to print smudge..."
              className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-xs text-[#111827] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#ECEEF2] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                movementType === "OUTWARD"
                  ? "bg-[#111827] hover:bg-black"
                  : "bg-[#00A86B] hover:bg-[#00925d]"
              } disabled:opacity-50`}
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <span>
                  {movementType === "OUTWARD" ? "Issue Challan Outward" : "Record Goods Receipt"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
