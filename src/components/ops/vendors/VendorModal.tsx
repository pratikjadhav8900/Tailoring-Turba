"use client";

import React, { useState, useEffect } from "react";
import { X, Building2, Loader2, Plus, Check } from "lucide-react";
import type { OpsVendorPartner, PartnerType, PartnerService } from "@/types/ops";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vendor: OpsVendorPartner) => void;
  vendorToEdit?: OpsVendorPartner | null;
}

const ALL_PARTNER_TYPES: Array<{ key: PartnerType; label: string }> = [
  { key: "RAW_MATERIAL_SUPPLIER", label: "Raw Material Supplier" },
  { key: "FINISHED_GOODS_SUPPLIER", label: "Finished Goods Supplier" },
  { key: "TAILOR_MANUFACTURER", label: "Tailor / Manufacturer" },
  { key: "PRINTING_EMBROIDERY_PARTNER", label: "Printing & Embroidery Partner" },
];

const ALL_SERVICES: Array<{ key: PartnerService; label: string }> = [
  { key: "SCREEN_PRINTING", label: "Screen Printing" },
  { key: "DTF_PRINTING", label: "DTF Printing" },
  { key: "SUBLIMATION", label: "Sublimation" },
  { key: "UV_PRINTING", label: "UV Printing" },
  { key: "EMBROIDERY", label: "Embroidery" },
  { key: "STITCHING", label: "Garment Stitching" },
  { key: "FABRIC_SUPPLY", label: "Raw Fabric Supply" },
  { key: "FINISHED_GOODS_SUPPLY", label: "Finished Goods Supply" },
];

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vendorToEdit,
}) => {
  const isEditing = Boolean(vendorToEdit);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<PartnerType[]>([]);
  const [selectedServices, setSelectedServices] = useState<PartnerService[]>([]);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [products, setProducts] = useState("");
  const [location, setLocation] = useState("");
  const [contactPersons, setContactPersons] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vendorToEdit) {
      setName(vendorToEdit.name || "");
      setCode(vendorToEdit.code || "");
      setSelectedTypes(vendorToEdit.partnerTypes || []);
      setSelectedServices(vendorToEdit.services || []);
      setCategory(vendorToEdit.category || "");
      setSubcategory(vendorToEdit.subcategory || "");
      setProducts(vendorToEdit.products || "");
      setLocation(vendorToEdit.location || "");
      setContactPersons(vendorToEdit.contactPersons || "");
      setPhone(vendorToEdit.phone || "");
      setEmail(vendorToEdit.email || "");
      setPanNumber(vendorToEdit.panNumber || "");
      setGstNumber(vendorToEdit.gstNumber || "");
      setInternalNotes(vendorToEdit.internalNotes || "");
    } else {
      setName("");
      setCode("");
      setSelectedTypes([]);
      setSelectedServices([]);
      setCategory("");
      setSubcategory("");
      setProducts("");
      setLocation("");
      setContactPersons("");
      setPhone("");
      setEmail("");
      setPanNumber("");
      setGstNumber("");
      setInternalNotes("");
    }
    setError(null);
  }, [vendorToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleType = (type: PartnerType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleService = (srv: PartnerService) => {
    setSelectedServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Partner / Business Name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      code: code.trim() || undefined,
      partnerTypes: selectedTypes,
      services: selectedServices,
      category: category.trim() || undefined,
      subcategory: subcategory.trim() || undefined,
      products: products.trim() || undefined,
      location: location.trim() || undefined,
      contactPersons: contactPersons.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      panNumber: panNumber.trim() || undefined,
      gstNumber: gstNumber.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,
    };

    try {
      const url = isEditing
        ? `/api/ops/vendors/${vendorToEdit!.id}`
        : "/api/ops/vendors";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save partner.");
        setLoading(false);
        return;
      }

      onSuccess(data.vendor);
      onClose();
    } catch (err: any) {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-white border border-[#E5E7EB] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#ECEEF2] flex items-center justify-between bg-[#F8F9FB] shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                {isEditing ? `Edit Partner — ${vendorToEdit?.name}` : "Add New Vendor / Partner"}
              </h3>
              <p className="text-xs text-[#6B7280]">
                Single source of truth for external production partners
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Partner / Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. KB Corp, AMAR VAGGU, Prime"
                className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Partner Code (Optional)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. TAILOR/AMAR VAGGU/001"
                className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Pune, Tirupur, Mumbai, Delhi"
                className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Partner Classification Types */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1.5">
              Partner Classification Types (Select all that apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_PARTNER_TYPES.map((pt) => {
                const selected = selectedTypes.includes(pt.key);
                return (
                  <button
                    key={pt.key}
                    type="button"
                    onClick={() => toggleType(pt.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                      selected
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-white border-[#E5E7EB] text-[#4B5563] hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                        selected
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                    </div>
                    <span>{pt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Supported Services */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1.5">
              Production & Decoration Services
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SERVICES.map((srv) => {
                const selected = selectedServices.includes(srv.key);
                return (
                  <button
                    key={srv.key}
                    type="button"
                    onClick={() => toggleService(srv.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563] hover:bg-gray-100"
                    }`}
                  >
                    {srv.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Products & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Category / Work Handled
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Shirting + Suiting, Pant, Screen"
                className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Products / Subcategory
              </label>
              <input
                type="text"
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                placeholder="e.g. Hosiery, Aprons, Kids Shorts"
                className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Contact Person(s)
              </label>
              <input
                type="text"
                value={contactPersons}
                onChange={(e) => setContactPersons(e.target.value)}
                placeholder="e.g. Ramesh Bhai, Mahesh"
                className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9822193664"
                className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                GSTIN
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="GSTIN"
                className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-emerald-600 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                PAN
              </label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                placeholder="PAN"
                className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-emerald-600 font-mono uppercase"
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Internal Team Notes
            </label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="e.g. Prefers WhatsApp communication. Delivers fabric in 2 days."
              className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#ECEEF2] flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Save & Select Partner
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
