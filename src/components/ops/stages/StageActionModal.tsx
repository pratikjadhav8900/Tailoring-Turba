"use client";

import React, { useState } from "react";
import { X, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
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
  const isLastStage = currentStage === "CLOSED";
  const defaultNextStage =
    currentIndex >= 0 && currentIndex < STAGE_SEQUENCE.length - 1
      ? STAGE_SEQUENCE[currentIndex + 1]
      : currentStage || "NEW_ORDER";

  const [targetStage, setTargetStage] = useState<OpsProductionStage>(
    isLastStage ? "CLOSED" : defaultNextStage
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payment = calculateAdvancePaymentDetails(totalAmount, amountPaid);
  const isAdvancingPastStep2 =
    currentStage === "ORDER_CONFIRMED" && targetStage === "RESOURCE_FABRIC";

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
          targetStage: isLastStage ? "CLOSED" : targetStage,
          status: isLastStage || targetStage === "CLOSED" ? "COMPLETED" : undefined,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update stage.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-[#ECEEF2] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#ECEEF2] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B] shrink-0">
              {isLastStage ? (
                <CheckCircle2 className="w-5 h-5 text-[#00A86B]" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#111827] font-sans">
                {isLastStage ? "Complete & Close Order" : "Advance Production Stage"}
              </h3>
              <p className="text-[11px] text-[#00A86B] font-semibold font-mono">
                Order TT-{orderNumber} {isLastStage ? "• Step 7 of 7 Final Milestone" : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
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

          {isLastStage ? (
            /* --- FINAL STAGE: COMPLETE / CLOSE ORDER VIEW --- */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#00A86B]/10 border border-[#00A86B]/20 text-xs font-sans">
                <div className="flex items-center gap-2 font-bold text-sm text-[#065F46] mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0" />
                  <span>All 7 Pipeline Stages Reached</span>
                </div>
                <p className="text-[11px] text-[#047857] leading-relaxed">
                  Order TT-{orderNumber} has traversed all manufacturing, quality check, and dispatch steps. Completing this order marks delivery as confirmed and finalizes the manufacturing cycle.
                </p>
              </div>

              {payment.amountPaid < totalAmount && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-sans flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-amber-900 block">Payment Settlement</span>
                    <span className="text-[11px] text-amber-800">
                      ₹{(totalAmount - payment.amountPaid).toLocaleString("en-IN")} balance pending of ₹{totalAmount.toLocaleString("en-IN")} total.
                    </span>
                  </div>
                  {onOpenPaymentModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPaymentModal();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 cursor-pointer shadow-2xs"
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5 font-sans">
                  Completion / Delivery Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Delivered to client. Received signed delivery challan and final payment..."
                  className="w-full bg-[#F8F9FA] border border-[#ECEEF2] focus:border-[#00A86B] focus:bg-white rounded-xl p-3 text-xs text-[#111827] placeholder:text-[#9CA3AF] outline-none resize-none font-sans transition-all"
                />
              </div>
            </div>
          ) : (
            /* --- STANDARD ADVANCE STAGE VIEW --- */
            <>
              {/* From / To visual indicator */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] text-xs">
                <div>
                  <span className="text-[#6B7280] block text-[10px] font-bold uppercase tracking-wider font-sans">
                    Current Stage
                  </span>
                  <span className="font-bold text-[#111827] text-sm mt-0.5 block font-sans">
                    {currentStage ? STAGE_DISPLAY_NAMES[currentStage] : "Initial"}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B] shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-[#00A86B] block text-[10px] font-bold uppercase tracking-wider font-sans">
                    Target Stage
                  </span>
                  <span className="font-bold text-[#00A86B] text-sm mt-0.5 block font-sans">
                    {STAGE_DISPLAY_NAMES[targetStage]}
                  </span>
                </div>
              </div>

              {/* Advance Payment Gate Warning */}
              {isAdvancingPastStep2 && !payment.isAdvanceCleared && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>60% Advance Payment Checkpoint</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-sans">
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
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      Record Payment Now (₹{payment.remainingAdvance.toLocaleString("en-IN")})
                    </button>
                  )}
                </div>
              )}

              {/* Select Target Stage */}
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5 font-sans">
                  Select Target Stage
                </label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as OpsProductionStage)}
                  className="w-full bg-[#F8F9FA] border border-[#ECEEF2] focus:border-[#00A86B] focus:bg-white rounded-xl p-2.5 text-xs text-[#111827] font-sans font-semibold outline-none transition-all cursor-pointer"
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
                <label className="block text-xs font-bold text-[#111827] mb-1.5 font-sans">
                  Stage Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Pattern pieces checked and bundled into 5 bags..."
                  className="w-full bg-[#F8F9FA] border border-[#ECEEF2] focus:border-[#00A86B] focus:bg-white rounded-xl p-3 text-xs text-[#111827] placeholder:text-[#9CA3AF] outline-none resize-none font-sans transition-all"
                />
              </div>
            </>
          )}

          {/* Actions */}
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
              className="px-5 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-bold shadow-md shadow-[#00A86B]/20 transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLastStage ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : null}
              <span>{isLastStage ? "Close & Complete Order" : "Confirm Transition"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
