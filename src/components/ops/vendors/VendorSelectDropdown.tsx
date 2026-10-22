"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, Check, Building2, ChevronDown, MapPin, Tag } from "lucide-react";
import type { OpsVendorPartner, OpsProductionStage, PartnerType } from "@/types/ops";
import { VendorModal } from "./VendorModal";

interface VendorSelectDropdownProps {
  value?: string | null; // vendorId
  onChange: (vendorId: string, vendor: OpsVendorPartner) => void;
  allowedPartnerTypes?: PartnerType[];
  stage?: OpsProductionStage;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export const EXTERNAL_WORK_STAGES: OpsProductionStage[] = [
  "RESOURCE_FABRIC",
  "CUTTING",
  "STITCHING",
  "BRANDING_PRINTING",
];

export const VendorSelectDropdown: React.FC<VendorSelectDropdownProps> = ({
  value,
  onChange,
  allowedPartnerTypes,
  stage,
  label = "External Vendor / Partner",
  required = false,
  placeholder = "Select or search vendor/partner...",
}) => {
  const [vendors, setVendors] = useState<OpsVendorPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [isNewPartnerModalOpen, setIsNewPartnerModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch vendors
  useEffect(() => {
    const loadVendors = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/ops/vendors?limit=200");
        if (res.ok) {
          const data = await res.json();
          setVendors(data.vendors || []);
        }
      } catch (e) {
        console.error("Failed to load vendors", e);
      } finally {
        setLoading(false);
      }
    };
    loadVendors();
  }, []);

  // Map stage to preferred partner type
  const preferredType: PartnerType | null = stage === "RESOURCE_FABRIC"
    ? "RAW_MATERIAL_SUPPLIER"
    : stage === "CUTTING" || stage === "STITCHING"
    ? "TAILOR_MANUFACTURER"
    : stage === "BRANDING_PRINTING"
    ? "PRINTING_EMBROIDERY_PARTNER"
    : null;

  // Filter vendors based on stage preference & search term
  const filteredVendors = vendors.filter((v) => {
    // Filter by explicitly allowed partner types if specified
    if (!showAllTypes && allowedPartnerTypes && allowedPartnerTypes.length > 0 && v.partnerTypes.length > 0) {
      const match = v.partnerTypes.some((t) => allowedPartnerTypes.includes(t));
      if (!match) return false;
    } else if (!showAllTypes && preferredType && v.partnerTypes.length > 0) {
      if (!v.partnerTypes.includes(preferredType)) {
        return false;
      }
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      (v.code && v.code.toLowerCase().includes(q)) ||
      (v.location && v.location.toLowerCase().includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q)) ||
      (v.products && v.products.toLowerCase().includes(q)) ||
      (v.phone && v.phone.includes(q))
    );
  });

  const selectedVendor = vendors.find((v) => v.id === value);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-[#374151] mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main Select Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-xs border rounded-xl bg-white flex items-center justify-between cursor-pointer transition-all ${
          isOpen
            ? "border-emerald-600 ring-1 ring-emerald-600"
            : selectedVendor
            ? "border-[#D1D5DB] hover:border-gray-400"
            : required
            ? "border-amber-300 bg-amber-50/20"
            : "border-[#D1D5DB]"
        }`}
      >
        {selectedVendor ? (
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-bold text-[#111827] truncate">
              {selectedVendor.name}
            </span>
            {selectedVendor.code && (
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                {selectedVendor.code}
              </span>
            )}
            {selectedVendor.location && (
              <span className="text-[11px] text-gray-500 truncate shrink-0">
                • {selectedVendor.location}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-400 truncate">{placeholder}</span>
        )}

        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-72 animate-fadeIn">
          {/* Search bar inside dropdown */}
          <div className="p-2 border-b border-[#ECEEF2] bg-[#F8F9FB] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, city, product..."
              className="w-full bg-transparent text-xs text-[#111827] focus:outline-none"
              autoFocus
            />
            {preferredType && (
              <button
                type="button"
                onClick={() => setShowAllTypes(!showAllTypes)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 transition-colors ${
                  showAllTypes
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {showAllTypes ? "Filtered" : "All Directory"}
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto divide-y divide-[#F3F4F6] flex-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-gray-400">Loading partners...</div>
            ) : filteredVendors.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500">No matching partner found.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsNewPartnerModalOpen(true);
                  }}
                  className="mt-2 text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add "{search || "New Partner"}" to Directory
                </button>
              </div>
            ) : (
              filteredVendors.map((vendor) => {
                const isSelected = vendor.id === value;
                return (
                  <div
                    key={vendor.id}
                    onClick={() => {
                      onChange(vendor.id, vendor);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 hover:bg-emerald-50/50 cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected ? "bg-emerald-50/70" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#111827]">
                          {vendor.name}
                        </span>
                        {vendor.code && (
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            {vendor.code}
                          </span>
                        )}
                        {vendor.location && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 text-gray-400" />
                            {vendor.location}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-[#6B7280] mt-0.5 truncate">
                        {vendor.category || vendor.products || (
                          vendor.services.length > 0
                            ? vendor.services.map((s) => s.replace(/_/g, " ")).join(", ")
                            : "General Partner"
                        )}
                        {vendor.phone && ` • 📞 ${vendor.phone}`}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Add New Partner Action Footer */}
          <div className="p-2 border-t border-[#ECEEF2] bg-[#F8F9FB] flex items-center justify-between shrink-0">
            <span className="text-[10px] text-gray-500">Can't find the partner?</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsNewPartnerModalOpen(true);
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Partner
            </button>
          </div>
        </div>
      )}

      {/* Inline Modal for adding a partner immediately */}
      <VendorModal
        isOpen={isNewPartnerModalOpen}
        onClose={() => setIsNewPartnerModalOpen(false)}
        onSuccess={(newVendor) => {
          setVendors((prev) => [newVendor, ...prev]);
          onChange(newVendor.id, newVendor);
          setIsNewPartnerModalOpen(false);
        }}
      />
    </div>
  );
};
