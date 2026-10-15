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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171916]/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white border border-[#e2e0d8] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#8b2020]/10 border-b border-[#8b2020]/25 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#8b2020]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <h3 className="text-sm font-bold text-[#171916] font-mono uppercase tracking-wider">
              Flag Defect & Initiate Rework — TT-{orderNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#829386] hover:text-[#171916] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded bg-[#8b2020]/10 border border-[#8b2020]/30 text-[#8b2020] text-xs font-mono font-medium">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#e2e0d8] text-xs text-[#4a4a45] leading-relaxed">
            Flagging rework marks the order with <strong className="text-[#8b2020] font-mono">FLAGGED_REWORK</strong> and returns it to the selected production stage with an incremented iteration counter. Once corrected, it returns directly to Quality Inspection.
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171916] mb-1.5 font-mono uppercase text-[11px]">
              Select Defective Stage to Return To
            </label>
            <select
              value={targetStage}
              onChange={(e) => setTargetStage(e.target.value as OpsProductionStage)}
              className="w-full bg-[#FAF9F5] border border-[#e2e0d8] focus:border-[#8b2020] focus:bg-white rounded p-2 text-xs text-[#171916] font-mono outline-none"
            >
              {REWORKABLE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_DISPLAY_NAMES[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171916] mb-1.5 font-mono uppercase text-[11px]">
              Defect & Rework Rationale (Required)
            </label>
            <textarea
              required
              rows={4}
              value={reworkReason}
              onChange={(e) => setReworkReason(e.target.value)}
              placeholder="Detail the specific defects found (e.g. Broken seams along right collar, collar misaligned on 5 size L pieces)..."
              className="w-full bg-[#FAF9F5] border border-[#e2e0d8] focus:border-[#8b2020] focus:bg-white rounded p-2.5 text-xs text-[#171916] placeholder:text-[#829386] outline-none resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e0d8]">
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
