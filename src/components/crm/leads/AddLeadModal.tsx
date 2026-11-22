"use client";

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { LEAD_SOURCE_LABELS, PRODUCT_CATEGORIES } from "@/types/crm";
import type { CrmEmployee } from "@/types/crm";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  salesReps: CrmEmployee[];
}

const inputCls =
  "w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none transition-all";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  companyName: "",
  source: "OTHER",
  productCategory: "",
  expectedValue: "",
  requirements: "",
  quantity: "",
  city: "",
  assignedToId: "",
};

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onCreated, salesReps }) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [duplicate, setDuplicate] = useState<{ id: string; name: string } | null>(null);

  if (!isOpen) return null;

  const update = (field: string, value: string) => {
    setDuplicate(null);
    setForm((f) => ({ ...f, [field]: value }));
  };

  const submitLead = async (force: boolean) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: form.quantity ? Number(form.quantity) : undefined,
          expectedValue: form.expectedValue ? Number(form.expectedValue) : undefined,
          assignedToId: form.assignedToId || undefined,
          force,
        }),
      });

      if (res.status === 409) {
        const data = await res.json();
        setDuplicate(data.duplicate);
        setSubmitting(false);
        return;
      }

      if (!res.ok) throw new Error((await res.json()).error || "Failed to create lead");

      toast.success("Lead created");
      setForm(emptyForm);
      setDuplicate(null);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Lead name is required");
      return;
    }
    await submitLead(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEEF2] sticky top-0 bg-white z-10">
          <h2 className="text-sm font-bold text-[#111827]">Add Lead</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111827]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {duplicate && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2 text-amber-800 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  A lead with this phone or email already exists: <strong>{duplicate.name}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/crm/leads/${duplicate.id}`} className="text-[#FF6A39] font-semibold hover:underline">
                  Open Existing Lead
                </Link>
                <span className="text-amber-700">·</span>
                <button
                  type="button"
                  onClick={() => submitLead(true)}
                  className="text-amber-800 font-semibold hover:underline"
                >
                  Continue With New Lead
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Name<span className="text-red-500">*</span>
              </label>
              <input className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Customer name" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Phone</label>
              <input className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Email</label>
              <input className={inputCls} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@company.com" type="email" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Company</label>
              <input className={inputCls} value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Company name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">City</label>
              <input className={inputCls} value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Source</label>
              <select className={inputCls} value={form.source} onChange={(e) => update("source", e.target.value)}>
                {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Product Category</label>
              <select className={inputCls} value={form.productCategory} onChange={(e) => update("productCategory", e.target.value)}>
                <option value="">Select category</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Quantity</label>
              <input className={inputCls} value={form.quantity} onChange={(e) => update("quantity", e.target.value)} placeholder="Pieces" type="number" min={0} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Expected Value (₹)</label>
              <input className={inputCls} value={form.expectedValue} onChange={(e) => update("expectedValue", e.target.value)} placeholder="150000" type="number" min={0} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Assign To</label>
              <select className={inputCls} value={form.assignedToId} onChange={(e) => update("assignedToId", e.target.value)}>
                <option value="">Unassigned</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name} ({rep.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Requirements</label>
              <textarea className={inputCls} rows={3} value={form.requirements} onChange={(e) => update("requirements", e.target.value)} placeholder="What does this customer need?" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold text-[#4B5563] hover:bg-[#F4F6F9] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
