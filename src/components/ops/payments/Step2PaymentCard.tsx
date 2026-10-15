"use client";

import React, { useState } from "react";
import {
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Plus,
  Loader2,
  Lock,
  Unlock,
  ShieldCheck,
  FileText,
  Building,
  Smartphone,
  Banknote,
  Receipt,
} from "lucide-react";
import { OpsButton } from "@/components/ops/ui/OpsButton";
import { calculateAdvancePaymentDetails } from "@/lib/ops/workflow";
import type { OpsOrder } from "@/types/ops";

interface Step2PaymentCardProps {
  order: OpsOrder;
  onPaymentRecorded?: () => void;
  compact?: boolean;
}

export const Step2PaymentCard: React.FC<Step2PaymentCardProps> = ({
  order,
  onPaymentRecorded,
  compact = false,
}) => {
  const [isOpenRecordModal, setIsOpenRecordModal] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH" | "BANK_TRANSFER" | "CHEQUE">("UPI");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payment = calculateAdvancePaymentDetails(
    order.totalAmount,
    order.amountPaid
  );

  const remainingBalance = Math.max(0, payment.totalAmount - payment.amountPaid);
  const isFullyPaid = remainingBalance <= 0;

  const isStep2 = order.opsStage === "ORDER_CONFIRMED";
  const isOutsideWebsite =
    order.orderSource === "NATURAL" ||
    order.orderSource === "REFERRAL" ||
    order.orderSource === "PHONE" ||
    order.orderSource === "WHATSAPP" ||
    order.orderSource === "MANUAL_OPS";

  const handleOpenModal = (presetAmount?: number) => {
    if (isFullyPaid) return;
    setError(null);
    if (presetAmount !== undefined) {
      setAmountInput(String(Math.min(remainingBalance, presetAmount)));
    } else {
      setAmountInput(
        payment.remainingAdvance > 0
          ? String(payment.remainingAdvance)
          : String(remainingBalance)
      );
    }
    setIsOpenRecordModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid positive payment amount.");
      return;
    }
    if (parsedAmount > remainingBalance) {
      setError(
        `Cannot record more than remaining balance of ₹${remainingBalance.toLocaleString("en-IN")}.`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/ops/orders/${order.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          mode: paymentMode,
          reference: reference.trim(),
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record payment.");
        setIsSubmitting(false);
        return;
      }

      setIsOpenRecordModal(false);
      setReference("");
      setNote("");
      if (onPaymentRecorded) {
        onPaymentRecorded();
      }
    } catch (err: any) {
      setError("An unexpected error occurred while recording payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRecordPaymentModal = () => {
    if (!isOpenRecordModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
        <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#ECEEF2] flex items-center justify-between bg-[#F8F9FB]">
            <div>
              <h4 className="text-sm font-bold text-[#111827]">
                Record Customer Payment — TT-{order.orderNumber}
              </h4>
              <p className="text-[11px] text-[#6B7280]">
                Record payment received outside website (UPI, Cash, Cheque)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpenRecordModal(false)}
              className="w-7 h-7 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleRecordPayment} className="p-5 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* Amount Input & Quick Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#374151]">
                  Amount Received (₹)<span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Max payable: ₹{remainingBalance.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-bold text-[#6B7280]">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  max={remainingBalance}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Enter amount in ₹"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm font-bold text-[#111827] focus:border-[#00A86B] outline-none"
                />
              </div>

              {/* Quick Fill Chips */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {payment.remainingAdvance > 0 && payment.remainingAdvance < remainingBalance && (
                  <button
                    type="button"
                    onClick={() => setAmountInput(String(payment.remainingAdvance))}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold hover:bg-amber-100 transition-colors"
                  >
                    60% Advance Gate: ₹{payment.remainingAdvance.toLocaleString("en-IN")}
                  </button>
                )}
                {remainingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmountInput(String(remainingBalance))}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    Full Remaining Balance: ₹{remainingBalance.toLocaleString("en-IN")}
                  </button>
                )}
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Payment Mode<span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "UPI", label: "UPI / GPay / PhonePe", icon: Smartphone },
                  { id: "CASH", label: "Cash In Hand", icon: Banknote },
                  { id: "BANK_TRANSFER", label: "Bank (NEFT / RTGS)", icon: Building },
                  { id: "CHEQUE", label: "Cheque Deposit", icon: Receipt },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMode(m.id as any)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        isSelected
                          ? "bg-[#00A86B]/10 border-[#00A86B] text-[#00A86B] font-bold"
                          : "bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563] hover:border-[#CBD5E1]"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference / UTR Number */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Reference / UTR / Cheque # (Optional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UTR-493820194 or Cheque #10423"
                className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs text-[#111827] focus:border-[#00A86B] outline-none"
              />
            </div>

            {/* Internal Staff Note */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Payment Note (Optional)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Paid in cash to floor manager at factory"
                className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs text-[#111827] focus:border-[#00A86B] outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECEEF2]">
              <button
                type="button"
                onClick={() => setIsOpenRecordModal(false)}
                className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <span>Confirm & Record</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div
        className={`rounded-2xl p-3.5 border transition-all ${
          isFullyPaid
            ? "bg-emerald-50/50 border-emerald-300"
            : payment.isAdvanceCleared
            ? "bg-emerald-50/30 border-emerald-200"
            : isStep2
            ? "bg-amber-50/60 border-amber-300 shadow-2xs"
            : "bg-white border-[#ECEEF2]"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                isFullyPaid || payment.isAdvanceCleared
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-500 text-white"
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#111827]">
                  {isFullyPaid
                    ? "Paid in Full"
                    : payment.isAdvanceCleared
                    ? "60% Advance Cleared"
                    : "Advance Payment Due"}
                </span>
                <span className="text-[10px] font-mono font-bold text-[#00A86B] bg-[#E6F7F0] px-1.5 py-0.2 rounded border border-[#B3E8D3]">
                  {payment.currentPercentage}%
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                ₹{payment.amountPaid.toLocaleString("en-IN")} of ₹{payment.totalAmount.toLocaleString("en-IN")} received
                {!isFullyPaid && (
                  <span className="text-[#374151] font-semibold">
                    {" "}• ₹{remainingBalance.toLocaleString("en-IN")} balance
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {!isFullyPaid && (
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="h-7 px-3 rounded-lg bg-[#00A86B] hover:bg-[#00925d] text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs active:scale-98 transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Record</span>
              </button>
            )}
          </div>
        </div>

        {/* Slender Progress Track */}
        <div className="relative w-full h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden mt-2.5">
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-black/40 z-10"
            style={{ left: "60%" }}
            title="60% Target"
          />
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              payment.isAdvanceCleared
                ? "bg-gradient-to-r from-[#00A86B] to-[#10B981]"
                : "bg-gradient-to-r from-amber-500 to-amber-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(5, payment.currentPercentage))}%` }}
          />
        </div>

        {renderRecordPaymentModal()}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        isFullyPaid
          ? "bg-emerald-50/50 border-emerald-300"
          : payment.isAdvanceCleared
          ? "bg-emerald-50/30 border-emerald-200"
          : isStep2
          ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20 shadow-sm"
          : "bg-white border-[#ECEEF2]"
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isFullyPaid || payment.isAdvanceCleared
                ? "bg-emerald-600 text-white"
                : "bg-amber-500 text-white"
            }`}
          >
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[#111827]">
                Payment Status & 60% Advance Gate
              </h3>
              {isOutsideWebsite && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {order.orderSource} Intake
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B7280]">
              Orders require minimum 60% advance payment before procurement & production begin.
            </p>
          </div>
        </div>

        {isFullyPaid ? (
          <div className="h-8 px-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>✓ Paid in Full (100%)</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="h-8 px-3.5 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* Progress & Financial Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 text-xs">
        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB]">
          <span className="text-[10px] text-[#6B7280] font-semibold uppercase block">
            Total Order Value
          </span>
          <span className="text-sm sm:text-base font-extrabold text-[#111827] mt-0.5 block font-mono">
            ₹{payment.totalAmount.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB]">
          <span className="text-[10px] text-[#6B7280] font-semibold uppercase block">
            60% Advance Required
          </span>
          <span className="text-sm sm:text-base font-extrabold text-[#111827] mt-0.5 block font-mono">
            ₹{payment.requiredAdvance.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB]">
          <span className="text-[10px] text-[#00A86B] font-semibold uppercase block">
            Total Received
          </span>
          <span className="text-sm sm:text-base font-extrabold text-[#00A86B] mt-0.5 block font-mono">
            ₹{payment.amountPaid.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB]">
          <span className="text-[10px] font-semibold uppercase block text-[#6B7280]">
            {isFullyPaid
              ? "Payment Status"
              : payment.remainingAdvance > 0
              ? "Balance to Reach 60%"
              : "Remaining Balance"}
          </span>
          <span
            className={`text-sm sm:text-base font-extrabold mt-0.5 block font-mono ${
              isFullyPaid
                ? "text-emerald-700"
                : payment.remainingAdvance > 0
                ? "text-amber-700"
                : "text-blue-700"
            }`}
          >
            {isFullyPaid
              ? "✓ Paid in Full"
              : payment.remainingAdvance > 0
              ? `₹${payment.remainingAdvance.toLocaleString("en-IN")}`
              : `₹${remainingBalance.toLocaleString("en-IN")} (at delivery)`}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#4B5563]">
          <div className="flex items-center gap-1.5">
            {isFullyPaid ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                100% Fully Settled — No Balance Remaining
              </span>
            ) : payment.isAdvanceCleared ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                60% Advance Gate Cleared ({payment.currentPercentage}% received • ₹{remainingBalance.toLocaleString("en-IN")} balance due at delivery)
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Advance Pending: ₹{payment.remainingAdvance.toLocaleString("en-IN")} more required for Stage 3
              </span>
            )}
          </div>
          <span className="text-xs font-mono font-bold text-[#111827]">
            {payment.currentPercentage}% of Total
          </span>
        </div>

        <div className="relative w-full h-3 rounded-full bg-[#E5E7EB] overflow-hidden">
          {/* Target 60% Marker line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-black/40 z-10"
            style={{ left: "60%" }}
            title="60% Target"
          />
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              payment.isAdvanceCleared
                ? "bg-gradient-to-r from-[#00A86B] to-[#10B981]"
                : "bg-gradient-to-r from-amber-500 to-amber-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(5, payment.currentPercentage))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
          <span>₹0</span>
          <span className="text-amber-800 font-bold">▲ 60% Target (₹{payment.requiredAdvance.toLocaleString("en-IN")})</span>
          <span>100% (₹{payment.totalAmount.toLocaleString("en-IN")})</span>
        </div>
      </div>

      {renderRecordPaymentModal()}
    </div>
  );
};
