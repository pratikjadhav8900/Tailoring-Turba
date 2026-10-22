"use client";

import React, { useState } from "react";
import { X, Layers } from "lucide-react";
import { OpsButton } from "../ui/OpsButton";
import { VendorSelectDropdown } from "@/components/ops/vendors/VendorSelectDropdown";

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
  const [vendorId, setVendorId] = useState<string | null>(null);
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
          vendorId: vendorId || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-[#ECEEF2] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#ECEEF2] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B] shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#111827] font-sans">
                Fabric & Resource Allocation
              </h3>
              <p className="text-[11px] text-[#00A86B] font-semibold font-mono">
                Order TT-{orderNumber}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <VendorSelectDropdown
                value={vendorId}
                onChange={(id, vendor) => {
                  setVendorId(id);
                  if (vendor) {
                    setFabricSupplier(vendor.name);
                  }
                }}
                allowedPartnerTypes={["RAW_MATERIAL_SUPPLIER", "FINISHED_GOODS_SUPPLIER"]}
                stage="RESOURCE_FABRIC"
                label="Raw Material & Fabric Supplier"
                required={false}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5 font-sans">
                Roll / Batch #
              </label>
              <input
                type="text"
                value={fabricBatchNumber}
                onChange={(e) => setFabricBatchNumber(e.target.value)}
                placeholder="e.g. ROLL-884A"
                className="w-full bg-[#F8F9FA] border border-[#ECEEF2] focus:border-[#00A86B] focus:bg-white rounded-xl p-2.5 text-xs text-[#111827] font-mono outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5 font-sans">
                Allocated Meters
              </label>
              <input
                type="number"
                step="0.1"
                value={metersAllocated}
                onChange={(e) => setMetersAllocated(e.target.value)}
                placeholder="e.g. 45.5"
                className="w-full bg-[#F8F9FA] border border-[#ECEEF2] focus:border-[#00A86B] focus:bg-white rounded-xl p-2.5 text-xs text-[#111827] font-mono outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5 font-sans">
                Thread Color Code
              </label>
              <input
                type="text"
                value={threadColorCode}
                onChange={(e) => setThreadColorCode(e.target.value)}
                placeholder="e.g. Coats #1094 Navy"
                className="w-full bg-[#F8F9FA] border border-[#ECEEF2] focus:border-[#00A86B] focus:bg-white rounded-xl p-2.5 text-xs text-[#111827] outline-none font-sans transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5 font-sans">
              Trims & Accessories Allocated
            </label>
            <input
              type="text"
              value={trimsAllocated}
              onChange={(e) => setTrimsAllocated(e.target.value)}
              placeholder="e.g. Ribbed collars, woven neck labels, size tags"
              className="w-full bg-[#F8F9FA] border border-[#ECEEF2] focus:border-[#00A86B] focus:bg-white rounded-xl p-2.5 text-xs text-[#111827] font-sans outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5 font-sans">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fabric inspected for GSM consistency and shade variation..."
              className="w-full bg-[#F8F9FA] border border-[#ECEEF2] focus:border-[#00A86B] focus:bg-white rounded-xl p-3 text-xs text-[#111827] font-sans outline-none resize-none transition-all"
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
              className="px-5 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-bold shadow-md shadow-[#00A86B]/20 transition-all active:scale-98 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Save Resource Allocation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
