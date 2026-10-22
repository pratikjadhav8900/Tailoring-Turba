"use client";

import React, { useState, useEffect, useMemo } from "react";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { OpsCard } from "@/components/ops/ui/OpsCard";
import { OpsButton } from "@/components/ops/ui/OpsButton";
import { OpsLoadingState } from "@/components/ops/ui/OpsLoadingState";
import { VendorModal } from "@/components/ops/vendors/VendorModal";
import { VendorDetailDrawer } from "@/components/ops/vendors/VendorDetailDrawer";
import type { OpsVendorPartner, PartnerType, PartnerService } from "@/types/ops";
import {
  Building2,
  Search,
  Plus,
  Filter,
  Phone,
  MapPin,
  Tag,
  Scissors,
  Truck,
  Layers,
  Sparkles,
  ChevronRight,
  Edit2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  RAW_MATERIAL_SUPPLIER: "Raw Material",
  FINISHED_GOODS_SUPPLIER: "Finished Goods",
  TAILOR_MANUFACTURER: "Tailor / Stitching",
  PRINTING_EMBROIDERY_PARTNER: "Print & Embroidery",
};

export default function OpsVendorsPage() {
  const [vendors, setVendors] = useState<OpsVendorPartner[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedService, setSelectedService] = useState<string>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<OpsVendorPartner | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedType !== "ALL") params.set("type", selectedType);
      if (selectedService !== "ALL") params.set("service", selectedService);
      if (selectedLocation !== "ALL") params.set("location", selectedLocation);
      params.set("status", statusFilter);

      const res = await fetch(`/api/ops/vendors?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load vendors");
      const data = await res.json();
      setVendors(data.vendors || []);
      if (data.locations) setLocations(data.locations);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load vendors. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search, selectedType, selectedService, selectedLocation, statusFilter]);

  const handleDeactivate = async (id: string) => {
    if (!confirm("Are you sure you want to change this partner's active status?")) return;
    try {
      const res = await fetch(`/api/ops/vendors/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchVendors();
        setSelectedVendorId(null);
      }
    } catch (e) {
      console.error("Deactivate error", e);
    }
  };

  return (
    <OpsLayout
      pageTitle="Vendors & Production Partners"
      pageSubtitle="Single source of truth for fabric suppliers, manufacturers, tailors, and decoration partners"
    >
      <div className="space-y-5 w-full">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#ECEEF2] shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search partner by name, code, contact, service, or city..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-emerald-600 bg-[#F9FAFB] focus:bg-white transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-[#E5E7EB] rounded-xl bg-white text-[#374151] focus:outline-none focus:border-emerald-600"
            >
              <option value="ALL">All Partner Types</option>
              <option value="RAW_MATERIAL_SUPPLIER">Raw Material Suppliers</option>
              <option value="FINISHED_GOODS_SUPPLIER">Finished Goods Suppliers</option>
              <option value="TAILOR_MANUFACTURER">Tailors / Manufacturers</option>
              <option value="PRINTING_EMBROIDERY_PARTNER">Print & Embroidery</option>
            </select>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-[#E5E7EB] rounded-xl bg-white text-[#374151] focus:outline-none focus:border-emerald-600"
            >
              <option value="ALL">All Cities</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-[#E5E7EB] rounded-xl bg-white text-[#374151] focus:outline-none focus:border-emerald-600"
            >
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="all">All Records</option>
            </select>

            {/* Add Partner Action */}
            <button
              type="button"
              onClick={() => {
                setVendorToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Partner
            </button>
          </div>
        </div>

        {/* Content View: Table for Desktop / Cards for Mobile */}
        {loading ? (
          <OpsLoadingState message="Loading partner directory..." />
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-red-200">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-red-700">{error}</p>
            <button
              onClick={fetchVendors}
              className="mt-3 text-xs font-semibold text-emerald-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#ECEEF2]">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#111827]">No partners found</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Try adjusting your search criteria or add a new partner to the directory.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#ECEEF2] overflow-hidden shadow-xs">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FB] border-b border-[#ECEEF2] text-[#6B7280] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Partner & Code</th>
                    <th className="py-3 px-4">Type / Classification</th>
                    <th className="py-3 px-4">Services / Products</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-center">Orders</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEEF2]">
                  {vendors.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVendorId(v.id)}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#111827] group-hover:text-emerald-700 transition-colors">
                          {v.name}
                        </div>
                        {v.code ? (
                          <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {v.code}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No code</span>
                        )}
                        {v.sourceNotes && (
                          <div className="text-[10px] text-amber-700 mt-0.5 max-w-[200px] truncate" title={v.sourceNotes}>
                            Note: {v.sourceNotes}
                          </div>
                        )}
                      </td>

                      {/* Partner Type */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {v.partnerTypes.length > 0 ? (
                            v.partnerTypes.map((pt) => (
                              <span
                                key={pt}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-[#374151]"
                              >
                                {PARTNER_TYPE_LABELS[pt] || pt}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Unspecified</span>
                          )}
                        </div>
                      </td>

                      {/* Services & Products */}
                      <td className="py-3 px-4">
                        <div className="text-[#374151] max-w-[220px]">
                          {v.products || v.category || (
                            v.services.length > 0 ? (
                              <span className="text-emerald-700 font-medium">
                                {v.services.map((s) => s.replace(/_/g, " ")).join(", ")}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">—</span>
                            )
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-[#4B5563]">
                        {v.location ? (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {v.location}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>

                      {/* Phone / Contact */}
                      <td className="py-3 px-4 text-[#4B5563]">
                        {v.phone ? (
                          <span className="font-mono text-emerald-800 font-semibold inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {v.phone}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </td>

                      {/* Assignment Count */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F4F6F9] text-[#111827]">
                          {v._count?.assignments || 0}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVendorToEdit(v);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors inline-block mr-1"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-[#ECEEF2]">
              {vendors.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVendorId(v.id)}
                  className="p-4 space-y-2 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#111827]">{v.name}</div>
                      {v.code && (
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                          {v.code}
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F4F6F9] text-[#111827]">
                      {v._count?.assignments || 0} orders
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {v.partnerTypes.map((pt) => (
                      <span
                        key={pt}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-[#374151]"
                      >
                        {PARTNER_TYPE_LABELS[pt] || pt}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#4B5563] pt-1">
                    <span>{v.location || "Location not specified"}</span>
                    {v.phone && <span className="font-mono font-bold text-emerald-800">{v.phone}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <VendorModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setVendorToEdit(null);
        }}
        onSuccess={() => {
          fetchVendors();
          setIsAddModalOpen(false);
          setVendorToEdit(null);
        }}
        vendorToEdit={vendorToEdit}
      />

      {/* Detail Drawer */}
      <VendorDetailDrawer
        vendorId={selectedVendorId}
        isOpen={Boolean(selectedVendorId)}
        onClose={() => setSelectedVendorId(null)}
        onEdit={(v) => {
          setSelectedVendorId(null);
          setVendorToEdit(v);
          setIsAddModalOpen(true);
        }}
        onDeactivate={handleDeactivate}
      />
    </OpsLayout>
  );
}
