"use client";

import React, { useState } from "react";
import { X, ArrowRight, ShieldAlert } from "lucide-react";
import {
  STAGE_SEQUENCE,
  STAGE_DISPLAY_NAMES,
  calculateAdvancePaymentDetails,
} from "@/lib/ops/workflow";
import type { OpsProductionStage } from "@/types/ops";
import { OpsButton } from "../ui/OpsButton";

interface StageActionModalProps {
  orderId: string;
  orderNumber: number;
  currentStage: OpsProductionStage | null;
  totalAmount?: number;
  amountPaid?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenPaymentModal?: () => void;
}

export const StageActionModal: React.FC<StageActionModalProps> = ({
  orderId,
  orderNumber,
  currentStage,
  totalAmount = 0,
  amountPaid = 0,
  isOpen,
  onClose,
  onSuccess,
  onOpenPaymentModal,
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

  const payment = calculateAdvancePaymentDetails(totalAmount, amountPaid);
  const isAdvancingPastStep2 =
    currentStage === "ORDER_CONFIRMED" && targetStage === "RESOURCE_FABRIC";
  const isAdvanceBlocked = isAdvancingPastStep2 && !payment.isAdvanceCleared && !isOverride;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171916]/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white border border-[#e2e0d8] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#e2e0d8] flex items-center justify-between bg-[#FAF9F5]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#171916] font-mono uppercase tracking-wider">
              Advance Production Stage — TT-{orderNumber}
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

          {/* From / To visual indicator */}
          <div className="flex items-center justify-between p-3.5 rounded bg-[#FAF9F5] border border-[#e2e0d8] text-xs">
            <div>
              <span className="text-[#829386] block text-[10px] font-mono uppercase">Current Stage</span>
              <span className="font-bold text-[#171916] font-mono mt-0.5 block">
                {currentStage ? STAGE_DISPLAY_NAMES[currentStage] : "Initial"}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#294238]" />
            <div>
              <span className="text-[#829386] block text-[10px] font-mono uppercase">Target Stage</span>
              <span className="font-bold text-[#294238] font-mono mt-0.5 block">
                {STAGE_DISPLAY_NAMES[targetStage]}
              </span>
            </div>
          </div>

          {/* Advance Payment Gate Warning */}
          {isAdvancingPastStep2 && !payment.isAdvanceCleared && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>60% Advance Payment Checkpoint</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Standard manufacturing requires at least 60% advance payment before starting Procurement.
                Currently received: <strong>₹{payment.amountPaid.toLocaleString("en-IN")}</strong> of required{" "}
                <strong>₹{payment.requiredAdvance.toLocaleString("en-IN")}</strong> (
                <strong>₹{payment.remainingAdvance.toLocaleString("en-IN")}</strong> pending).
              </p>
              {onOpenPaymentModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPaymentModal();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                >
                  Record Payment Now (₹{payment.remainingAdvance.toLocaleString("en-IN")})
                </button>
              )}
            </div>
          )}

          {/* Select Target Stage */}
          <div>
            <label className="block text-xs font-semibold text-[#171916] mb-1.5 font-mono uppercase text-[11px]">
              Select Target Stage
            </label>
            <select
              value={targetStage}
              onChange={(e) => setTargetStage(e.target.value as OpsProductionStage)}
              className="w-full bg-[#FAF9F5] border border-[#e2e0d8] focus:border-[#294238] focus:bg-white rounded p-2 text-xs text-[#171916] font-mono outline-none"
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
            <label className="block text-xs font-semibold text-[#171916] mb-1.5 font-mono uppercase text-[11px]">
              Stage Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pattern pieces checked and bundled into 5 bags..."
              className="w-full bg-[#FAF9F5] border border-[#e2e0d8] focus:border-[#294238] focus:bg-white rounded p-2.5 text-xs text-[#171916] placeholder:text-[#829386] outline-none resize-none font-sans"
            />
          </div>

          {/* Supervisor Override Checkbox */}
          <div className="pt-2 border-t border-[#e2e0d8]">
            <label className="flex items-center gap-2 text-xs text-[#4a4a45] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isOverride}
                onChange={(e) => setIsOverride(e.target.checked)}
                className="rounded bg-[#FAF9F5] border-[#c8c5bc] text-[#294238] focus:ring-0"
              />
              <ShieldAlert className="w-3.5 h-3.5 text-[#B88970]" />
              <span className="font-medium">
                Supervisor Override (Requires Audit Reason — Allows bypassing 60% gate or sequencing)
              </span>
            </label>

            {isOverride && (
              <div className="mt-3 space-y-1.5">
                <label className="block text-[11px] font-bold text-[#8c563b] font-mono uppercase">
                  Override Rationale (Required)
                </label>
                <input
                  type="text"
                  required={isOverride}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why standard advance payment or sequencing is bypassed..."
                  className="w-full bg-[#FAF9F5] border border-[#B88970] rounded p-2 text-xs text-[#171916] outline-none font-sans"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e0d8]">
            <OpsButton type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </OpsButton>
            <OpsButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              disabled={isAdvanceBlocked}
            >
              {isAdvanceBlocked ? "60% Advance Required" : "Confirm Transition"}
            </OpsButton>
          </div>
        </form>
      </div>
    </div>
  );
};
