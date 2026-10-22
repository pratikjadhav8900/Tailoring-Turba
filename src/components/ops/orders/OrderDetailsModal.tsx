"use client";

import React, { useState, useEffect } from "react";
import type { OpsOrder, OpsActivityEvent } from "@/types/ops";
import { OpsBadge } from "@/components/ops/ui/OpsBadge";
import { InternalNotesPanel } from "@/components/ops/notes/InternalNotesPanel";
import { ActivityTimeline } from "@/components/ops/activity/ActivityTimeline";
import { Step2PaymentCard } from "@/components/ops/payments/Step2PaymentCard";
import {
  X,
  Layers,
  MapPin,
  IndianRupee,
  Palette,
  FileText,
  User,
  Printer,
  ExternalLink,
  Download,
  Trash2,
  Plus,
  Upload,
  UploadCloud,
  Paperclip,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  Building2,
} from "lucide-react";
import { ExternalAssignmentsCard } from "@/components/ops/vendors/ExternalAssignmentsCard";

interface OrderDetailsModalProps {
  order: OpsOrder;
  isOpen: boolean;
  onClose: () => void;
  activityEvents?: OpsActivityEvent[];
  onRefresh?: () => void;
  onUploadAsset?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadMockup?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAsset?: (fileUrl: string) => void;
  isUploadingAsset?: boolean;
  isUploadingMockup?: boolean;
  assetFileInputRef?: React.RefObject<HTMLInputElement>;
  mockupFileInputRef?: React.RefObject<HTMLInputElement>;
}

type DetailTab = "SPECS" | "CUSTOMER" | "FINANCIALS" | "ARTWORK" | "VENDORS" | "NOTES";

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  activityEvents = [],
  onRefresh,
  onUploadAsset,
  onUploadMockup,
  onRemoveAsset,
  isUploadingAsset = false,
  isUploadingMockup = false,
  assetFileInputRef,
  mockupFileInputRef,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>("SPECS");
  const [copiedId, setCopiedId] = useState(false);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalMockups = order.items.flatMap((item) =>
    [item.mockupUrl, item.mockupUrlBack, item.mockupUrlLeft, item.mockupUrlRight].filter(Boolean)
  ).length;

  const totalFiles = Array.from(new Set(order.items.flatMap((i) => i.printFiles || []))).length;
  const totalPaymentsCount = order.paymentTransactions?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-4xl bg-white rounded-t-[28px] sm:rounded-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-[#ECEEF2] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1 bg-[#D1D5DB] rounded-full mx-auto sm:hidden mt-2.5 mb-1" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#ECEEF2] flex items-center justify-between bg-[#F8F9FB] shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-base font-extrabold text-[#111827]">
                {order.formattedOrderNumber}
              </span>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] text-[11px] font-mono shadow-2xs">
                <span className="text-[#9CA3AF] text-[9px] font-bold uppercase">ID:</span>
                <span className="font-semibold text-[#111827]">{order.id.slice(0, 8)}...</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(order.id);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="p-0.5 rounded hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827] transition-colors"
                  title={`Copy unique order ID: ${order.id}`}
                >
                  {copiedId ? (
                    <Check className="w-3 h-3 text-[#00A86B]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <OpsBadge stage={order.opsStage} size="sm" />
              <OpsBadge status={order.currentExecution?.status || "PENDING"} size="sm" />
            </div>
            <p className="text-xs text-[#6B7280] truncate mt-0.5 font-medium">
              {order.customer.companyName || order.customer.name || "Customer Order"} • {order.totalQuantity} pcs • Total ₹{order.totalAmount.toLocaleString("en-IN")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[#4B5563] hover:text-[#111827] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-2 bg-white border-b border-[#ECEEF2] overflow-x-auto no-scrollbar shrink-0 select-none">
          <button
            type="button"
            onClick={() => setActiveTab("SPECS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === "SPECS"
                ? "bg-[#00A86B] text-white shadow-2xs"
                : "bg-[#F4F6F9] text-[#4B5563] hover:bg-[#E5E7EB]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Garment & Specs</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "SPECS" ? "bg-white/20 text-white" : "bg-white text-[#6B7280]"
              }`}
            >
              {order.items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CUSTOMER")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === "CUSTOMER"
                ? "bg-[#00A86B] text-white shadow-2xs"
                : "bg-[#F4F6F9] text-[#4B5563] hover:bg-[#E5E7EB]"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Customer & Delivery</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("FINANCIALS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === "FINANCIALS"
                ? "bg-[#00A86B] text-white shadow-2xs"
                : "bg-[#F4F6F9] text-[#4B5563] hover:bg-[#E5E7EB]"
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Ledger & Payments</span>
            {totalPaymentsCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "FINANCIALS" ? "bg-white/20 text-white" : "bg-white text-[#6B7280]"
                }`}
              >
                {totalPaymentsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ARTWORK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === "ARTWORK"
                ? "bg-[#00A86B] text-white shadow-2xs"
                : "bg-[#F4F6F9] text-[#4B5563] hover:bg-[#E5E7EB]"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Artwork & Tech Packs</span>
            {(totalMockups > 0 || totalFiles > 0) && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "ARTWORK" ? "bg-white/20 text-white" : "bg-white text-[#6B7280]"
                }`}
              >
                {totalMockups + totalFiles}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("VENDORS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === "VENDORS"
                ? "bg-[#00A86B] text-white shadow-2xs"
                : "bg-[#F4F6F9] text-[#4B5563] hover:bg-[#E5E7EB]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Vendors & Partners</span>
            {order.externalAssignments && order.externalAssignments.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "VENDORS" ? "bg-white/20 text-white" : "bg-white text-[#6B7280]"
                }`}
              >
                {order.externalAssignments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("NOTES")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === "NOTES"
                ? "bg-[#00A86B] text-white shadow-2xs"
                : "bg-[#F4F6F9] text-[#4B5563] hover:bg-[#E5E7EB]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Staff Notes & Audit</span>
            {order.internalNotes?.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "NOTES" ? "bg-white/20 text-white" : "bg-white text-[#6B7280]"
                }`}
              >
                {order.internalNotes.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: GARMENT & SPECS */}
          {activeTab === "SPECS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span className="font-bold uppercase tracking-wider text-[11px]">
                  Garment Products ({order.items.length})
                </span>
                <span>
                  Total Units: <strong className="text-[#111827]">{order.totalQuantity} pcs</strong>
                </span>
              </div>

              {/* Official Quotation Document Card */}
              {order.quotationUrl && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border border-blue-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#111827] truncate">
                          {order.quotationFileName || "Quotation-Document.pdf"}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                          Official Quotation
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        Uploaded customer quotation PDF attached during order intake
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={order.quotationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View PDF</span>
                    </a>
                    <a
                      href={order.quotationUrl}
                      download={order.quotationFileName || "quotation.pdf"}
                      className="p-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {order.items.map((item, idx) => {
                const custom = (item.customState as any) || {};
                const sizes = custom.sizes || {};
                const sizeKeys = Object.keys(sizes);
                const fabricDisplay = item.fabric || custom.fabric;
                const colorDisplay = custom.color;
                const brandDisplay = custom.brand;
                const typeDisplay = item.fit || custom.garmentType;
                const logoName = custom.logoName;
                const logoType = custom.logoType;
                const logoPos = custom.logoPosition;
                const sizeNote = custom.sizeNote || custom.notes;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-3 shadow-2xs"
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[#111827] truncate">
                          #{idx + 1} — {item.productName}
                        </h4>
                        <div className="text-xs text-[#6B7280] flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-medium">
                          {fabricDisplay && (
                            <span>
                              Fabric: <strong className="text-[#111827]">{fabricDisplay}</strong>
                            </span>
                          )}
                          {colorDisplay && (
                            <span>
                              Color: <strong className="text-[#111827]">{colorDisplay}</strong>
                            </span>
                          )}
                          {typeDisplay && (
                            <span>
                              Type: <strong className="text-[#111827]">{typeDisplay}</strong>
                            </span>
                          )}
                          {brandDisplay && (
                            <span>
                              Brand: <strong className="text-[#111827]">{brandDisplay}</strong>
                            </span>
                          )}
                          {item.gsm && (
                            <span>
                              GSM: <strong className="text-[#111827]">{item.gsm}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center justify-center font-mono text-xs sm:text-sm font-bold text-[#00A86B] px-2.5 py-1 rounded-full bg-[#E6F7F0] border border-[#B3E8D3] whitespace-nowrap shadow-2xs">
                          {item.quantity} pcs
                        </span>
                      </div>
                    </div>

                    {/* Branding Details Badge */}
                    {(logoName || logoType || logoPos || custom.branding) && (
                      <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] text-xs text-[#374151] flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#111827] text-[11px] uppercase tracking-wider">
                          Branding:
                        </span>
                        {logoType && (
                          <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] font-bold text-[10px] border border-[#DBEAFE]">
                            {logoType}
                          </span>
                        )}
                        {logoName && (
                          <span className="font-semibold text-[#111827]">Logo: {logoName}</span>
                        )}
                        {logoPos && <span className="text-[#6B7280]">({logoPos})</span>}
                      </div>
                    )}

                    {/* Cutting Size Breakdown Matrix */}
                    {sizeKeys.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">
                            Cutting Size Breakdown
                          </span>
                          {custom.sizeRange && (
                            <span className="text-[10px] text-[#9CA3AF] font-medium">
                              Range: {custom.sizeRange}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                          {sizeKeys.map((size) => (
                            <div
                              key={size}
                              className="p-2 rounded-lg bg-white border border-[#ECEEF2] text-center shadow-2xs"
                            >
                              <div className="text-[10px] text-[#6B7280] font-bold uppercase">
                                {size}
                              </div>
                              <div className="text-xs font-bold font-mono text-[#111827] mt-0.5">
                                {sizes[size]}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#9CA3AF] italic">
                        Total Quantity: {item.quantity} pcs (No segmented size matrix specified).
                      </div>
                    )}

                    {/* Size Surcharge / Production Note */}
                    {sizeNote && (
                      <div className="text-[11px] text-[#B45309] bg-amber-50/70 border border-amber-200 px-2.5 py-1 rounded-lg">
                        {sizeNote}
                      </div>
                    )}

                    {/* Print Tech Specifications */}
                    {custom.printTechnology && (
                      <div className="text-xs text-[#4B5563] flex items-center gap-2 pt-2 border-t border-[#ECEEF2]">
                        <Printer className="w-3.5 h-3.5 text-[#00A86B]" />
                        <span>
                          Print Method: <strong className="text-[#111827]">{custom.printTechnology}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: CUSTOMER & DELIVERY */}
          {activeTab === "CUSTOMER" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Customer Information Card */}
                <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#111827]">
                    <User className="w-4 h-4 text-[#00A86B]" />
                    <span>Customer Information</span>
                  </div>
                  <div className="space-y-1.5 text-[#4B5563] pt-1">
                    <div className="font-bold text-sm text-[#111827]">
                      {order.customer.name || "Customer"}
                    </div>
                    {order.customer.companyName && (
                      <div className="text-[#00A86B] font-semibold text-xs">
                        {order.customer.companyName}
                      </div>
                    )}
                    <div className="text-[#6B7280]">{order.customer.email || "No email"}</div>
                    <div className="text-[#111827] font-mono font-medium">
                      {order.customer.phone || "No phone recorded"}
                    </div>
                    {order.customer.gstNumber && (
                      <div className="text-[#6B7280] font-mono text-[11px] pt-1 border-t border-[#ECEEF2]">
                        GSTIN: <strong>{order.customer.gstNumber}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address Card */}
                <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#111827]">
                    <MapPin className="w-4 h-4 text-[#00A86B]" />
                    <span>Shipping Address</span>
                  </div>
                  {order.shippingAddress ? (
                    <div className="space-y-1 text-[#4B5563] leading-relaxed pt-1">
                      <div className="font-bold text-[#111827]">{order.shippingAddress.name}</div>
                      <div>{order.shippingAddress.street}</div>
                      <div>
                        {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                        <strong className="text-[#111827] font-mono">
                          {order.shippingAddress.postalCode}
                        </strong>
                      </div>
                      <div className="text-[#9CA3AF] text-[11px]">{order.shippingAddress.country}</div>
                    </div>
                  ) : (
                    <div className="text-[#9CA3AF] italic text-xs pt-2">
                      No shipping address recorded on file.
                    </div>
                  )}
                </div>
              </div>

              {/* Logistics & Dispatch Card */}
              <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] text-xs space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
                  Logistics & Courier Delivery
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white border border-[#ECEEF2]">
                    <span className="text-[10px] text-[#9CA3AF] block font-semibold uppercase">
                      Courier Partner
                    </span>
                    <span className="font-bold text-[#111827] mt-0.5 block">
                      {order.courierName || "Bigship Logistics (Pending Booking)"}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-[#ECEEF2]">
                    <span className="text-[10px] text-[#9CA3AF] block font-semibold uppercase">
                      AWB / Tracking Number
                    </span>
                    <span className="font-mono font-bold text-[#111827] mt-0.5 block">
                      {order.awbNumber || "Not generated yet"}
                    </span>
                  </div>
                </div>

                {order.labelUrl && (
                  <div className="pt-1">
                    <a
                      href={order.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#111827] border border-[#ECEEF2] hover:bg-[#F4F6F9] font-semibold text-xs shadow-2xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#00A86B]" />
                      <span>Download Shipping Label</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIALS & LEDGER */}
          {activeTab === "FINANCIALS" && (
            <div className="space-y-5">
              {/* Full Payment Card */}
              <Step2PaymentCard
                order={order}
                onPaymentRecorded={onRefresh}
                compact={false}
              />

              {/* Recorded Payment Transactions Ledger */}
              <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-[#6B7280]">
                    Payment Transaction History ({order.paymentTransactions?.length || 0})
                  </span>
                  <span className="text-[11px] text-[#00A86B] font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Permanent Audit Ledger</span>
                  </span>
                </div>

                {!order.paymentTransactions || order.paymentTransactions.length === 0 ? (
                  <div className="text-center py-6 text-[#9CA3AF] italic bg-white rounded-lg border border-[#ECEEF2]">
                    No separate manual payment transactions logged yet. Amount paid on file: ₹{order.amountPaid.toLocaleString("en-IN")}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {order.paymentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-lg bg-white border border-[#ECEEF2] flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#111827] font-mono text-sm">
                              ₹{(tx.amountPaise / 100).toLocaleString("en-IN")}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6F7F0] text-[#00A86B] border border-[#B3E8D3]">
                              {tx.provider || "MANUAL"}
                            </span>
                            <span className="text-[10px] text-[#6B7280] font-mono uppercase">
                              {tx.status}
                            </span>
                          </div>
                          {tx.referenceNote && (
                            <p className="text-[11px] text-[#4B5563]">
                              Ref/Note: <strong className="text-[#111827]">{tx.referenceNote}</strong>
                            </p>
                          )}
                        </div>

                        <div className="text-[11px] text-[#9CA3AF] font-mono text-right">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5+ Year Archival Guarantee Callout */}
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-[#065F46] text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0" />
                  <span>
                    All order transactions and stage audits remain intact in the database for 5+ years. You can search or retrieve completed orders at any time.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ARTWORK & TECH PACKS */}
          {activeTab === "ARTWORK" && (
            <div className="space-y-5 text-xs">
              {/* Hidden File Inputs */}
              <input
                type="file"
                ref={assetFileInputRef}
                onChange={onUploadAsset}
                multiple
                accept=".cdr,.ai,.eps,.svg,.pdf,.png,.jpg,.jpeg,.psd,.zip"
                className="hidden"
              />
              <input
                type="file"
                ref={mockupFileInputRef}
                onChange={onUploadMockup}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />

              {/* Garment Placement Mockups */}
              <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-[#6B7280]">
                    Placement Mockups
                  </span>
                  <button
                    type="button"
                    onClick={() => mockupFileInputRef?.current?.click()}
                    disabled={isUploadingMockup}
                    className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isUploadingMockup ? "Uploading..." : "Add Placement Photo"}</span>
                  </button>
                </div>

                {(() => {
                  const mockups = order.items.flatMap((item) =>
                    [
                      { label: "Front", url: item.mockupUrl },
                      { label: "Back", url: item.mockupUrlBack },
                      { label: "Left Sleeve", url: item.mockupUrlLeft },
                      { label: "Right Sleeve", url: item.mockupUrlRight },
                    ].filter((m) => !!m.url)
                  );

                  if (mockups.length === 0) {
                    return (
                      <div
                        onClick={() => mockupFileInputRef?.current?.click()}
                        className="p-4 rounded-xl border border-dashed border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] cursor-pointer transition-colors text-center space-y-1.5"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#F4F6F9] border border-[#E5E7EB] mx-auto flex items-center justify-center text-[#6B7280]">
                          <UploadCloud className="w-3.5 h-3.5 text-[#2563EB]" />
                        </div>
                        <div className="text-xs font-semibold text-[#111827]">
                          No placement mockup attached yet
                        </div>
                        <p className="text-[11px] text-[#6B7280]">
                          Click to upload product render or factory sample photo (PNG, JPG)
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {mockups.map((m, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-white border border-[#ECEEF2] flex flex-col items-center shadow-2xs"
                        >
                          <div className="w-full aspect-square bg-[#F9FAFB] border border-[#ECEEF2] rounded-lg overflow-hidden flex items-center justify-center mb-2">
                            <img
                              src={m.url!}
                              alt={m.label}
                              className="object-contain w-full h-full"
                            />
                          </div>
                          <span className="text-[10px] text-[#4B5563] uppercase font-bold">
                            {m.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Official Quotation Document */}
              {order.quotationUrl && (
                <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-[#6B7280]">
                      Official Quotation Document
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                      PDF Linked
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#ECEEF2] flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-red-500" />
                      </div>
                      <span className="font-semibold text-[#111827] truncate font-mono text-xs">
                        {order.quotationFileName || "Quotation-Document.pdf"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={order.quotationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View PDF</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* High-Resolution Print Assets & Vector Files */}
              <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-[#6B7280]">
                    Print Assets & Vector Files (.CDR, .AI, .SVG, .PDF)
                  </span>
                  <button
                    type="button"
                    onClick={() => assetFileInputRef?.current?.click()}
                    disabled={isUploadingAsset}
                    className="text-[11px] font-semibold text-[#00A86B] hover:text-[#00925D] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isUploadingAsset ? "Uploading..." : "Attach Vector / CDR"}</span>
                  </button>
                </div>

                {(() => {
                  const allFiles = Array.from(
                    new Set(order.items.flatMap((i) => i.printFiles || []))
                  );

                  if (allFiles.length === 0) {
                    return (
                      <div
                        onClick={() => assetFileInputRef?.current?.click()}
                        className="p-4 rounded-xl border border-dashed border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] cursor-pointer transition-colors text-center space-y-1.5"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#F4F6F9] border border-[#E5E7EB] mx-auto flex items-center justify-center text-[#6B7280]">
                          <Paperclip className="w-3.5 h-3.5 text-[#00A86B]" />
                        </div>
                        <div className="text-xs font-semibold text-[#111827]">
                          No external print vector files attached
                        </div>
                        <p className="text-[11px] text-[#6B7280]">
                          Click to upload CorelDraw (.cdr), Adobe Illustrator (.ai), SVG, or high-res logo
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {allFiles.map((fileUrl, idx) => {
                        const fileName = fileUrl.split("/").pop() || `Asset-${idx + 1}`;
                        const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";

                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white border border-[#ECEEF2] flex items-center justify-between text-xs shadow-2xs hover:border-[#CBD5E1] transition-all gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#F3F4F6] text-[#1F2937] border border-[#E5E7EB]">
                                {ext}
                              </span>
                              <span className="font-semibold text-[#111827] truncate font-mono text-xs">
                                {fileName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-[#00A86B]/10 text-[#00A86B] hover:bg-[#00A86B]/20 flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>View</span>
                              </a>
                              {onRemoveAsset && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveAsset(fileUrl)}
                                  className="p-1 rounded text-[#9CA3AF] hover:text-red-500 transition-colors"
                                  title="Remove File"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB: VENDORS & PARTNERS */}
          {activeTab === "VENDORS" && (
            <div className="space-y-4">
              <ExternalAssignmentsCard
                order={order}
                onRefresh={onRefresh || (() => {})}
                isManager={true}
              />
            </div>
          )}

          {/* TAB 5: NOTES & AUDIT */}
          {activeTab === "NOTES" && (
            <div className="space-y-5 text-xs">
              {/* Internal Notes Panel */}
              <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-3">
                <span className="font-bold uppercase tracking-wider text-[11px] text-[#6B7280] block">
                  Internal Team Notes
                </span>
                <InternalNotesPanel
                  orderId={order.id}
                  initialNotes={order.internalNotes}
                />
              </div>

              {/* Stage Execution History Runs */}
              <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-3">
                <span className="font-bold uppercase tracking-wider text-[11px] text-[#6B7280] block">
                  Stage Execution History Runs ({order.stageExecutions?.length || 0})
                </span>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {!order.stageExecutions || order.stageExecutions.length === 0 ? (
                    <div className="text-xs text-[#9CA3AF] text-center py-4 italic">
                      No stage executions recorded yet.
                    </div>
                  ) : (
                    order.stageExecutions.map((exec) => (
                      <div
                        key={exec.id}
                        className="p-3 rounded-xl bg-white border border-[#ECEEF2] text-xs space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#111827] font-mono">
                            {exec.stage} (Iteration #{exec.iteration})
                          </span>
                          <OpsBadge status={exec.status} size="sm" />
                        </div>
                        <div className="text-[11px] text-[#6B7280]">
                          Operator: <strong className="text-[#111827]">{exec.employeeName}</strong>
                        </div>
                        {exec.notes && (
                          <p className="text-[11px] text-[#4B5563] italic bg-[#F9FAFB] p-2 rounded-lg border border-[#ECEEF2]">
                            "{exec.notes}"
                          </p>
                        )}
                        <div className="text-[10px] text-[#9CA3AF] font-mono pt-0.5 flex justify-between">
                          <span>
                            {new Date(exec.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity Timeline Audit */}
              <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-3">
                <span className="font-bold uppercase tracking-wider text-[11px] text-[#6B7280] block">
                  Accountability Audit Timeline
                </span>
                <ActivityTimeline events={activityEvents} />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#ECEEF2] bg-[#F8F9FB] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#6B7280] hidden sm:block">
            Order created on{" "}
            <strong>
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white hover:bg-[#F4F6F9] border border-[#D1D5DB] text-xs font-bold text-[#111827] transition-colors shadow-2xs cursor-pointer text-center"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
