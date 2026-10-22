"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Plus, Check, Building2, ChevronDown, MapPin, Tag, Layers, Scissors, Palette } from "lucide-react";
import type { OpsVendorPartner, OpsProductionStage, PartnerType } from "@/types/ops";
import { VendorModal } from "./VendorModal";

export interface VendorSelectDropdownProps {
  value?: string | null; // vendorId
  onChange: (vendorId: string, vendor: OpsVendorPartner) => void;
  allowedPartnerTypes?: PartnerType[];
  stage?: OpsProductionStage;
  taskKey?: string;
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

export function resolveAllowedPartnerTypes(
  allowedPartnerTypes?: PartnerType[],
  stage?: OpsProductionStage,
  taskKey?: string
): { targetTypes: PartnerType[]; categoryLabel: string } {
  if (allowedPartnerTypes && allowedPartnerTypes.length > 0) {
    const isProcurementOnly = allowedPartnerTypes.every(
      (t) => t === "RAW_MATERIAL_SUPPLIER" || t === "FINISHED_GOODS_SUPPLIER"
    );
    const isPrintOnly = allowedPartnerTypes.every((t) => t === "PRINTING_EMBROIDERY_PARTNER");
    const isTailorOnly = allowedPartnerTypes.every((t) => t === "TAILOR_MANUFACTURER");

    const categoryLabel = isProcurementOnly
      ? "Procurement Vendors"
      : isPrintOnly
      ? "Print & Embroidery Partners"
      : isTailorOnly
      ? "Tailors & Stitching Partners"
      : "Filtered Directory";

    return { targetTypes: allowedPartnerTypes, categoryLabel };
  }

  // Explicit subtask key matches
  if (taskKey === "PRINT_EMBROIDERY") {
    return {
      targetTypes: ["PRINTING_EMBROIDERY_PARTNER"],
      categoryLabel: "Print & Embroidery Partners",
    };
  }
  if (taskKey === "STITCHING" || taskKey === "KAJE_BUTTON") {
    return {
      targetTypes: ["TAILOR_MANUFACTURER"],
      categoryLabel: "Tailors & Stitching Partners",
    };
  }
  if (taskKey === "FABRIC_PROCUREMENT") {
    return {
      targetTypes: ["RAW_MATERIAL_SUPPLIER", "FINISHED_GOODS_SUPPLIER"],
      categoryLabel: "Procurement Vendors",
    };
  }

  // Stage-based matches
  if (stage === "RESOURCE_FABRIC") {
    return {
      targetTypes: ["RAW_MATERIAL_SUPPLIER", "FINISHED_GOODS_SUPPLIER"],
      categoryLabel: "Procurement Vendors",
    };
  }
  if (stage === "BRANDING_PRINTING") {
    return {
      targetTypes: ["PRINTING_EMBROIDERY_PARTNER"],
      categoryLabel: "Print & Embroidery Partners",
    };
  }
  if (stage === "CUTTING" || stage === "STITCHING") {
    return {
      targetTypes: ["TAILOR_MANUFACTURER"],
      categoryLabel: "Tailors & Stitching Partners",
    };
  }

  return { targetTypes: [], categoryLabel: "All Partners" };
}

export const VendorSelectDropdown: React.FC<VendorSelectDropdownProps> = ({
  value,
  onChange,
  allowedPartnerTypes,
  stage,
  taskKey,
  label = "External Vendor / Partner",
  required = false,
  placeholder,
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

  const { targetTypes, categoryLabel } = useMemo(
    () => resolveAllowedPartnerTypes(allowedPartnerTypes, stage, taskKey),
    [allowedPartnerTypes, stage, taskKey]
  );

  // Default placeholder based on category
  const effectivePlaceholder =
    placeholder ||
    (targetTypes.includes("PRINTING_EMBROIDERY_PARTNER") && targetTypes.length === 1
      ? "Select print & embroidery partner..."
      : targetTypes.includes("TAILOR_MANUFACTURER") && targetTypes.length === 1
      ? "Select tailor / stitching manufacturer..."
      : targetTypes.some((t) => t === "RAW_MATERIAL_SUPPLIER" || t === "FINISHED_GOODS_SUPPLIER")
      ? "Select procurement vendor (fabric, yarn, blanks)..."
      : "Select external partner...");

  // Strictly filter vendors based on category & search term
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      // Strict category filter when active:
      if (!showAllTypes && targetTypes.length > 0) {
        if (!v.partnerTypes || v.partnerTypes.length === 0) {
          return false;
        }
        const hasMatch = v.partnerTypes.some((t) => targetTypes.includes(t));
        if (!hasMatch) {
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
  }, [vendors, showAllTypes, targetTypes, search]);

  const selectedVendor = vendors.find((v) => v.id === value);

  const getPartnerBadge = (partnerTypes: PartnerType[]) => {
    if (
      partnerTypes.includes("RAW_MATERIAL_SUPPLIER") ||
      partnerTypes.includes("FINISHED_GOODS_SUPPLIER")
    ) {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          Procurement
        </span>
      );
    }
    if (partnerTypes.includes("PRINTING_EMBROIDERY_PARTNER")) {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
          Print & Emb
        </span>
      );
    }
    if (partnerTypes.includes("TAILOR_MANUFACTURER")) {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
          Tailor / Stitching
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1 gap-1.5">
          <label className="block text-xs font-bold text-[#374151] truncate">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {targetTypes.length > 0 && (
            <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
              {categoryLabel}
            </span>
          )}
        </div>
      )}

      {/* Main Select Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[38px] px-3 py-2 text-xs border rounded-xl bg-white flex items-center justify-between cursor-pointer transition-all ${
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
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 pr-1.5 overflow-hidden">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-bold text-[#111827] truncate">
              {selectedVendor.name}
            </span>
            {selectedVendor.code && (
              <span className="text-[9px] sm:text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 shrink-0">
                {selectedVendor.code}
              </span>
            )}
            {getPartnerBadge(selectedVendor.partnerTypes)}
            {selectedVendor.location && (
              <span className="hidden sm:inline text-[11px] text-gray-500 truncate shrink-0">
                • {selectedVendor.location}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-400 truncate text-[11px] sm:text-xs">{effectivePlaceholder}</span>
        )}

        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-64 sm:max-h-80 animate-fadeIn">
          {/* Header & Search */}
          <div className="p-2 border-b border-[#ECEEF2] bg-[#F8F9FB] space-y-1.5">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${targetTypes.length > 0 && !showAllTypes ? categoryLabel.toLowerCase() : "partners"}...`}
                className="w-full bg-transparent text-xs text-[#111827] focus:outline-none"
                autoFocus
              />
            </div>

            {/* Active Category Filter Header */}
            {targetTypes.length > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-[#ECEEF2] text-[10px] gap-1">
                <span className="text-gray-500 font-medium truncate">
                  {showAllTypes ? (
                    <span className="text-gray-700 font-semibold">All partners ({vendors.length})</span>
                  ) : (
                    <span>
                      Filtered to <strong className="text-emerald-700">{categoryLabel}</strong> ({filteredVendors.length})
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllTypes(!showAllTypes)}
                  className={`px-2 py-0.5 rounded font-bold shrink-0 transition-colors ${
                    showAllTypes
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {showAllTypes ? "Show Filtered" : "View All"}
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto divide-y divide-[#F3F4F6] flex-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-gray-400">Loading partners...</div>
            ) : filteredVendors.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500">
                  {targetTypes.length > 0 && !showAllTypes
                    ? `No matching partner in ${categoryLabel}.`
                    : "No matching partner found."}
                </p>
                {targetTypes.length > 0 && !showAllTypes && (
                  <button
                    type="button"
                    onClick={() => setShowAllTypes(true)}
                    className="mt-1.5 text-xs text-emerald-700 font-semibold hover:underline block mx-auto"
                  >
                    View all partners across all categories
                  </button>
                )}
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
                        {getPartnerBadge(vendor.partnerTypes)}
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
