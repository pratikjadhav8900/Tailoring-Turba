"use client";

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import {
  REWORKABLE_STAGES,
  STAGE_DISPLAY_NAMES,
} from "@/lib/ops/workflow";
import type { OpsProductionStage } from "@/types/ops";
import { OpsButton } from "../ui/OpsButton";

interface ReworkModalProps {
  orderId: string;
  orderNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReworkModal: React.FC<ReworkModalProps> = ({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [targetStage, setTargetStage] = useState<OpsProductionStage>("BRANDING_PRINTING");
  const [reworkReason, setReworkReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reworkReason.trim() || reworkReason.trim().length < 5) {
      setError("Please provide a detailed rework reason (minimum 5 characters).");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/ops/orders/${orderId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isRework: true,
          targetStage,
          reworkReason: reworkReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to flag rework.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-[#ECEEF2] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-red-900 font-sans">
                Flag Defect & Initiate Rework
              </h3>
              <p className="text-[11px] text-red-600 font-semibold font-mono">
                Order TT-{orderNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#6B7280] hover:text-[#111827] hover:bg-white/80 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold font-sans">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 text-xs text-red-900 leading-relaxed font-sans">
            Flagging rework marks the order with <strong className="font-semibold text-red-700">FLAGGED_REWORK</strong> and returns it to the selected production stage with an incremented iteration counter. Once corrected, it returns directly to Quality Inspection.
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5 font-sans">
              Select Defective Stage to Return To
            </label>
            <select
              value={targetStage}
              onChange={(e) => setTargetStage(e.target.value as OpsProductionStage)}
              className="w-full bg-[#F8F9FA] border border-[#ECEEF2] focus:border-red-500 focus:bg-white rounded-xl p-2.5 text-xs text-[#111827] font-sans font-semibold outline-none transition-all cursor-pointer"
            >
              {REWORKABLE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_DISPLAY_NAMES[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5 font-sans">
              Defect & Rework Rationale (Required)
            </label>
            <textarea
              required
              rows={4}
              value={reworkReason}
              onChange={(e) => setReworkReason(e.target.value)}
              placeholder="Detail the specific defects found (e.g. Broken seams along right collar, collar misaligned on 5 size L pieces)..."
              className="w-full bg-[#F8F9FA] border border-[#ECEEF2] focus:border-red-500 focus:bg-white rounded-xl p-3 text-xs text-[#111827] placeholder:text-[#9CA3AF] outline-none resize-none font-sans transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#ECEEF2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all active:scale-98 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Confirm Rework</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
