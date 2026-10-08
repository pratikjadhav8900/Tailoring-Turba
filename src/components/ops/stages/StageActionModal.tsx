"use client";

import React, { useState } from "react";
import { X, ArrowRight, ShieldAlert } from "lucide-react";
import {
  STAGE_SEQUENCE,
  STAGE_DISPLAY_NAMES,
} from "@/lib/ops/workflow";
import type { OpsProductionStage } from "@/types/ops";
import { OpsButton } from "../ui/OpsButton";

interface StageActionModalProps {
  orderId: string;
  orderNumber: number;
  currentStage: OpsProductionStage | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StageActionModal: React.FC<StageActionModalProps> = ({
  orderId,
  orderNumber,
  currentStage,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const currentIndex = currentStage ? STAGE_SEQUENCE.indexOf(currentStage) : -1;
  const defaultNextStage =
    currentIndex >= 0 && currentIndex < STAGE_SEQUENCE.length - 1
      ? STAGE_SEQUENCE[currentIndex + 1]
      : currentStage || "NEW_ORDER";

  const [targetStage, setTargetStage] = useState<OpsProductionStage>(defaultNextStage);
  const [notes, setNotes] = useState("");
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/ops/orders/${orderId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStage,
          notes: notes.trim(),
          isOverride,
          overrideReason: isOverride ? overrideReason.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to advance stage.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError("An unexpected error occurred while updating stage.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#10121a] border border-[#1e2230] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1e2230] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">
              Advance Production Stage — TT-{orderNumber}
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

          {/* From / To visual indicator */}
          <div className="flex items-center justify-between p-3 rounded bg-[#0b0d13] border border-[#1e2230] text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Current</span>
              <span className="font-semibold text-slate-200">
                {currentStage ? STAGE_DISPLAY_NAMES[currentStage] : "Initial"}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Target</span>
              <span className="font-semibold text-amber-400">
                {STAGE_DISPLAY_NAMES[targetStage]}
              </span>
            </div>
          </div>

          {/* Select Target Stage */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select Target Stage
            </label>
            <select
              value={targetStage}
              onChange={(e) => setTargetStage(e.target.value as OpsProductionStage)}
              className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 rounded p-2 text-xs text-slate-100 outline-none"
            >
              {STAGE_SEQUENCE.map((s) => (
                <option key={s} value={s}>
                  {STAGE_DISPLAY_NAMES[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Stage Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pattern pieces checked and bundled into 5 bags..."
              className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 rounded p-2.5 text-xs text-slate-100 placeholder:text-slate-600 outline-none resize-none"
            />
          </div>

          {/* Supervisor Override Checkbox */}
          <div className="pt-2 border-t border-[#1e2230]">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isOverride}
                onChange={(e) => setIsOverride(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
              />
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Enable Workflow Sequencing Override (Equal Authority — Requires Audit Reason)</span>
            </label>

            {isOverride && (
              <div className="mt-3 space-y-1.5">
                <label className="block text-[11px] font-semibold text-amber-400">
                  Override Rationale (Required)
                </label>
                <input
                  type="text"
                  required={isOverride}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why standard forward sequencing is bypassed..."
                  className="w-full bg-[#0b0d13] border border-amber-500/40 rounded p-2 text-xs text-slate-100 outline-none"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e2230]">
            <OpsButton type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </OpsButton>
            <OpsButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
            >
              Confirm Transition
            </OpsButton>
          </div>
        </form>
      </div>
    </div>
  );
};
