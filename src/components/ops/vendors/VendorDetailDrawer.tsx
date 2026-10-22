"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Tag,
  Package,
  Layers,
  Clock,
  ArrowUpRight,
  Edit2,
  Power,
  AlertCircle,
  Truck,
  CheckCircle2,
  ShieldCheck,
  FileText,
} from "lucide-react";
import type { OpsVendorPartner } from "@/types/ops";
import Link from "next/link";

interface VendorDetailDrawerProps {
  vendorId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (vendor: OpsVendorPartner) => void;
  onDeactivate: (vendorId: string) => void;
}

export const VendorDetailDrawer: React.FC<VendorDetailDrawerProps> = ({
  vendorId,
  isOpen,
  onClose,
  onEdit,
  onDeactivate,
}) => {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "assignments" | "movements">("overview");

  useEffect(() => {
    if (!vendorId || !isOpen) return;

    const fetchVendorDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ops/vendors/${vendorId}`);
        if (res.ok) {
          const data = await res.json();
          setVendor(data.vendor);
        }
      } catch (e) {
        console.error("Failed to fetch vendor", e);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorDetail();
  }, [vendorId, isOpen]);

  if (!isOpen || !vendorId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#ECEEF2] flex items-center justify-between bg-[#F8F9FB] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0 font-bold">
              {vendor?.name?.charAt(0) || <Building2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#111827] truncate">
                  {vendor?.name || "Loading Partner..."}
                </h3>
                {vendor?.isActive === false && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                    Inactive
                  </span>
                )}
              </div>
              {vendor?.code && (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                  {vendor.code}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vendor && (
              <button
                type="button"
                onClick={() => onEdit(vendor)}
                className="p-2 rounded-xl text-[#4B5563] hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                title="Edit Partner"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#ECEEF2] px-6 bg-white shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "assignments"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            Assignments
            {vendor?.assignments?.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-700">
                {vendor.assignments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("movements")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "movements"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            Goods Tracking
            {vendor?.goodsMovements?.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-700">
                {vendor.goodsMovements.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs">Loading partner records...</p>
            </div>
          ) : !vendor ? (
            <p className="text-xs text-gray-500">Partner information not found.</p>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Metric Summary Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 bg-[#F8F9FB] rounded-xl border border-[#ECEEF2]">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
                        Total Orders
                      </span>
                      <span className="text-xl font-extrabold text-[#111827] mt-1 block">
                        {vendor.metrics?.totalAssignments || 0}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        {vendor.metrics?.activeAssignments || 0} in progress
                      </span>
                    </div>

                    <div className="p-3.5 bg-[#F8F9FB] rounded-xl border border-[#ECEEF2]">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
                        Goods Sent
                      </span>
                      <span className="text-xl font-extrabold text-[#111827] mt-1 block">
                        {vendor.metrics?.totalQuantitySent || 0} pcs
                      </span>
                      <span className="text-[10px] text-[#4B5563]">
                        {vendor.metrics?.totalQuantityReceived || 0} received
                      </span>
                    </div>

                    <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                        Pending Goods
                      </span>
                      <span className="text-xl font-extrabold text-amber-900 mt-1 block">
                        {vendor.metrics?.pendingQuantity || 0} pcs
                      </span>
                      <span className="text-[10px] text-amber-700 font-medium">
                        Outstanding on floor
                      </span>
                    </div>
                  </div>

                  {/* Partner Types & Services */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                      Partner Classifications
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {vendor.partnerTypes?.length > 0 ? (
                        vendor.partnerTypes.map((pt: string) => (
                          <span
                            key={pt}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            {pt.replace(/_/g, " ")}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Category not specified in source document
                        </span>
                      )}
                    </div>
                  </div>

                  {vendor.services?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                        Supported Services
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {vendor.services.map((srv: string) => (
                          <span
                            key={srv}
                            className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {srv.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Information Card */}
                  <div className="p-4 bg-white rounded-xl border border-[#ECEEF2] space-y-3 shadow-xs">
                    <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                      Contact & Location
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[#6B7280] block text-[11px]">Location</span>
                        <span className="font-semibold text-[#111827] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {vendor.location || "Not specified"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block text-[11px]">Contact Person</span>
                        <span className="font-semibold text-[#111827] block mt-0.5">
                          {vendor.contactPersons || "Not specified"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block text-[11px]">Phone</span>
                        <span className="font-mono font-bold text-[#111827] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {vendor.phone ? (
                            <a href={`tel:${vendor.phone}`} className="text-emerald-700 hover:underline">
                              {vendor.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400 font-sans font-normal italic">
                              Not provided
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block text-[11px]">Tax / PAN / GST</span>
                        <span className="font-mono font-medium text-[#111827] block mt-0.5">
                          {vendor.gstNumber || vendor.panNumber || (
                            <span className="text-gray-400 font-sans italic">Blank</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Products & Category */}
                  {(vendor.category || vendor.products) && (
                    <div className="p-4 bg-white rounded-xl border border-[#ECEEF2] space-y-2">
                      <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                        Work & Product Specifications
                      </h4>
                      {vendor.category && (
                        <p className="text-xs text-[#374151]">
                          <span className="font-semibold text-[#111827]">Category: </span>
                          {vendor.category}
                        </p>
                      )}
                      {vendor.products && (
                        <p className="text-xs text-[#374151]">
                          <span className="font-semibold text-[#111827]">Products/Garments: </span>
                          {vendor.products}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Source Notes */}
                  {vendor.sourceNotes && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                      <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold mb-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Original Source Document Note
                      </div>
                      <p className="text-xs text-amber-900 font-mono">
                        {vendor.sourceNotes}
                      </p>
                    </div>
                  )}

                  {/* Internal Notes */}
                  {vendor.internalNotes && (
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-700 block mb-1">
                        Internal Factory Notes
                      </span>
                      <p className="text-xs text-gray-800">{vendor.internalNotes}</p>
                    </div>
                  )}

                  {/* Danger Zone: Deactivate */}
                  <div className="pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onDeactivate(vendor.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5"
                    >
                      <Power className="w-3.5 h-3.5" />
                      {vendor.isActive ? "Deactivate Partner" : "Activate Partner"}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: ASSIGNMENTS */}
              {activeTab === "assignments" && (
                <div className="space-y-3">
                  {vendor.assignments?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">No order assignments recorded yet.</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Assign this partner to orders from the production assignment modal.
                      </p>
                    </div>
                  ) : (
                    vendor.assignments.map((assignment: any) => (
                      <div
                        key={assignment.id}
                        className="p-3.5 rounded-xl border border-[#ECEEF2] bg-white hover:border-emerald-300 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/ops/orders/${assignment.order.id}`}
                            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            Order TT-{assignment.order.orderNumber}
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              assignment.status === "COMPLETED" || assignment.status === "RECEIVED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : assignment.status === "PARTIALLY_RECEIVED"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {assignment.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="text-xs text-[#4B5563]">
                          <span className="font-semibold text-[#111827]">
                            {assignment.stage.replace(/_/g, " ")}
                          </span>
                          {assignment.serviceOrProduct && ` • ${assignment.serviceOrProduct}`}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1 border-t border-gray-100">
                          <span>
                            Sent: <strong className="text-[#111827]">{assignment.quantitySent}</strong> •
                            Recv: <strong className="text-emerald-700">{assignment.quantityReceived}</strong> •
                            Pending:{" "}
                            <strong className="text-amber-700">
                              {Math.max(0, assignment.quantitySent - assignment.quantityReceived)}
                            </strong>
                          </span>
                          <span>
                            {assignment.assignedWorker?.name && `Worker: ${assignment.assignedWorker.name}`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: GOODS TRACKING */}
              {activeTab === "movements" && (
                <div className="space-y-3">
                  {vendor.goodsMovements?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">No challan or receipt entries recorded.</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Outward challans and inward receipts logged for this partner will appear here.
                      </p>
                    </div>
                  ) : (
                    vendor.goodsMovements.map((m: any) => {
                      const isOutward = m.movementType === "OUTWARD_CHALLAN";
                      return (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-xl border border-[#ECEEF2] bg-white space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isOutward
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {isOutward ? "Challan Sent (Outward)" : "Goods Received (Inward)"}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(m.movementDate).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-extrabold text-[#111827]">
                              {m.quantity} pieces
                            </span>
                            <Link
                              href={`/ops/orders/${m.order.id}`}
                              className="text-xs text-emerald-700 hover:underline font-mono"
                            >
                              TT-{m.order.orderNumber}
                            </Link>
                          </div>

                          {m.conditionNotes && (
                            <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-100">
                              Note: {m.conditionNotes}
                            </p>
                          )}

                          <div className="text-[10px] text-gray-500 pt-1">
                            Logged by {m.actorEmployeeName}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
