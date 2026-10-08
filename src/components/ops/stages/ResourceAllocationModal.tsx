"use client";

import React, { useState } from "react";
import { X, Layers } from "lucide-react";
import { OpsButton } from "../ui/OpsButton";

interface ResourceAllocationModalProps {
  orderId: string;
  orderNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResourceAllocationModal: React.FC<ResourceAllocationModalProps> = ({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fabricSupplier, setFabricSupplier] = useState("");
  const [fabricBatchNumber, setFabricBatchNumber] = useState("");
  const [metersAllocated, setMetersAllocated] = useState("");
  const [threadColorCode, setThreadColorCode] = useState("");
  const [trimsAllocated, setTrimsAllocated] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/ops/orders/${orderId}/resource`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fabricSupplier: fabricSupplier.trim(),
          fabricBatchNumber: fabricBatchNumber.trim(),
          metersAllocated: metersAllocated ? parseFloat(metersAllocated) : null,
          threadColorCode: threadColorCode.trim(),
          trimsAllocated: trimsAllocated.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record resource allocation.");
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
      <div className="w-full max-w-lg bg-[#10121a] border border-[#1e2230] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1e2230] flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500">
            <Layers className="w-4 h-4 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-100">
              Resource & Fabric Allocation — TT-{orderNumber}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fabric Supplier
              </label>
              <input
                type="text"
                value={fabricSupplier}
                onChange={(e) => setFabricSupplier(e.target.value)}
                placeholder="e.g. Vardhman Mills"
                className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 rounded p-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Roll / Batch #
              </label>
              <input
                type="text"
                value={fabricBatchNumber}
                onChange={(e) => setFabricBatchNumber(e.target.value)}
                placeholder="e.g. ROLL-884A"
                className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 rounded p-2 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Allocated Meters
              </label>
              <input
                type="number"
                step="0.1"
                value={metersAllocated}
                onChange={(e) => setMetersAllocated(e.target.value)}
                placeholder="e.g. 45.5"
                className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 rounded p-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Thread Color Code
              </label>
              <input
                type="text"
                value={threadColorCode}
                onChange={(e) => setThreadColorCode(e.target.value)}
                placeholder="e.g. Coats #1094 Navy"
                className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 rounded p-2 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Trims & Accessories Allocated
            </label>
            <input
              type="text"
              value={trimsAllocated}
              onChange={(e) => setTrimsAllocated(e.target.value)}
              placeholder="e.g. Ribbed collars, woven neck labels, size tags"
              className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 rounded p-2 text-xs text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fabric inspected for GSM consistency and shade variation..."
              className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 rounded p-2 text-xs text-slate-100 outline-none resize-none"
            />
          </div>

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
              Save Resource Allocation
            </OpsButton>
          </div>
        </form>
      </div>
    </div>
  );
};
