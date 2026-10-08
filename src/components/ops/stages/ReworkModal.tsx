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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#10121a] border border-red-500/40 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-red-500/10 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-100">
              Flag Defect & Initiate Rework — TT-{orderNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="p-3 rounded bg-red-500/[0.05] border border-red-500/20 text-xs text-red-300 leading-relaxed">
            Flagging rework marks the order with <strong className="text-red-400">FLAGGED_REWORK</strong> and returns it to the selected production stage with an incremented iteration counter. Once corrected, it will return directly to Quality Inspection.
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select Defective Stage to Return To
            </label>
            <select
              value={targetStage}
              onChange={(e) => setTargetStage(e.target.value as OpsProductionStage)}
              className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-red-500 rounded p-2 text-xs text-slate-100 outline-none"
            >
              {REWORKABLE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_DISPLAY_NAMES[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Defect & Rework Rationale (Required)
            </label>
            <textarea
              required
              rows={4}
              value={reworkReason}
              onChange={(e) => setReworkReason(e.target.value)}
              placeholder="Detail the specific defects found (e.g. Broken seams along right collar, collar misaligned on 5 size L pieces)..."
              className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-red-500 rounded p-2.5 text-xs text-slate-100 placeholder:text-slate-600 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e2230]">
            <OpsButton type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </OpsButton>
            <OpsButton
              type="submit"
              variant="danger"
              size="sm"
              isLoading={loading}
              leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
            >
              Confirm Rework
            </OpsButton>
          </div>
        </form>
      </div>
    </div>
  );
};
