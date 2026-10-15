"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { OpsCard } from "@/components/ops/ui/OpsCard";
import { OpsBadge } from "@/components/ops/ui/OpsBadge";
import { OpsButton } from "@/components/ops/ui/OpsButton";
import { OpsLoadingState } from "@/components/ops/ui/OpsLoadingState";
import { StageProgressBar } from "@/components/ops/stages/StageProgressBar";
import { StageActionModal } from "@/components/ops/stages/StageActionModal";
import { ReworkModal } from "@/components/ops/stages/ReworkModal";
import { ResourceAllocationModal } from "@/components/ops/stages/ResourceAllocationModal";
import { InternalNotesPanel } from "@/components/ops/notes/InternalNotesPanel";
import { ActivityTimeline } from "@/components/ops/activity/ActivityTimeline";
import { Step2PaymentCard } from "@/components/ops/payments/Step2PaymentCard";
import { OrderTasksList } from "@/components/ops/tasks/OrderTasksList";
import { TaskAssignmentModal } from "@/components/ops/tasks/TaskAssignmentModal";
import { OrderDetailsModal } from "@/components/ops/orders/OrderDetailsModal";
import type { OpsOrder, OpsActivityEvent, OpsPriority } from "@/types/ops";
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Layers,
  ChevronRight,
  ExternalLink,
  Download,
  User,
  UserCheck,
  MapPin,
  Printer,
  FileText,
  Upload,
  Plus,
  UploadCloud,
  Paperclip,
  Trash2,
} from "lucide-react";

export default function OpsOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OpsOrder | null>(null);
  const [activityEvents, setActivityEvents] = useState<OpsActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isReworkModalOpen, setIsReworkModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Metadata edit states
  const [priority, setPriority] = useState<OpsPriority>("NORMAL");
  const [dueDateInput, setDueDateInput] = useState<string>("");
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  // Asset & Mockup upload states
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [isUploadingMockup, setIsUploadingMockup] = useState(false);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const mockupFileInputRef = useRef<HTMLInputElement>(null);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ops/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setActivityEvents(data.activityEvents || []);
        setPriority(data.order.priority || "NORMAL");
        if (data.order.dueDate) {
          setDueDateInput(new Date(data.order.dueDate).toISOString().split("T")[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load order detail", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleUpdateMetadata = async (newPriority?: OpsPriority, newDueDate?: string) => {
    setIsSavingMetadata(true);
    try {
      const res = await fetch(`/api/ops/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority: newPriority !== undefined ? newPriority : priority,
          dueDate: newDueDate !== undefined ? newDueDate : dueDateInput || null,
        }),
      });

      if (res.ok) {
        fetchOrderDetail();
      }
    } catch (err) {
      console.error("Failed to update metadata", err);
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingAsset(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/ops/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        await fetch(`/api/ops/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPrintFiles: uploadedUrls }),
        });
        fetchOrderDetail();
      }
    } catch (err) {
      console.error("Asset upload failed", err);
    } finally {
      setIsUploadingAsset(false);
      if (assetFileInputRef.current) assetFileInputRef.current.value = "";
    }
  };

  const handleUploadMockup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMockup(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ops/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          await fetch(`/api/ops/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newMockupUrl: data.url }),
          });
          fetchOrderDetail();
        }
      }
    } catch (err) {
      console.error("Mockup upload failed", err);
    } finally {
      setIsUploadingMockup(false);
      if (mockupFileInputRef.current) mockupFileInputRef.current.value = "";
    }
  };

  const handleRemoveAsset = async (fileUrl: string) => {
    try {
      await fetch(`/api/ops/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removePrintFile: fileUrl }),
      });
      fetchOrderDetail();
    } catch (err) {
      console.error("Failed to remove asset", err);
    }
  };

  if (loading) {
    return (
      <OpsLayout pageTitle="Loading Order...">
        <OpsLoadingState message="Fetching order details..." />
      </OpsLayout>
    );
  }

  if (!order) {
    return (
      <OpsLayout pageTitle="Order Not Found">
        <div className="p-8 text-center text-[#9CA3AF]">
          <p>Order not found or invalid identifier.</p>
          <Link href="/ops/orders">
            <OpsButton variant="secondary" size="sm" className="mt-4">
              Return to Orders
            </OpsButton>
          </Link>
        </div>
      </OpsLayout>
    );
  }

  const isQCStage = order.opsStage === "QUALITY_CHECK";

  return (
    <OpsLayout
      pageTitle={`Order ${order.formattedOrderNumber}`}
      pageSubtitle={`Created on ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • Source: ${order.orderSource || "Website"}`}
      headerAction={
        <div className="hidden sm:flex items-center gap-2">
          <OpsButton
            variant="secondary"
            size="sm"
            onClick={() => setIsTaskModalOpen(true)}
            leftIcon={<UserCheck className="w-3.5 h-3.5 text-[#00A86B]" />}
          >
            Assign Tasks
          </OpsButton>

          <OpsButton
            variant="secondary"
            size="sm"
            onClick={() => setIsResourceModalOpen(true)}
            leftIcon={<Layers className="w-3.5 h-3.5 text-[#00A86B]" />}
          >
            Fabric Allocation
          </OpsButton>

          {isQCStage && (
            <OpsButton
              variant="danger"
              size="sm"
              onClick={() => setIsReworkModalOpen(true)}
              leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
            >
              Flag Defect
            </OpsButton>
          )}

          <OpsButton
            variant="primary"
            size="sm"
            onClick={() => setIsAdvanceModalOpen(true)}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Advance Stage
          </OpsButton>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-6 w-full pb-24 sm:pb-6">
        {/* Top Breadcrumb & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-2.5">
            <Link href="/ops/orders">
              <button
                className="w-9 h-9 rounded-full bg-white hover:bg-[#F4F6F9] border border-[#ECEEF2] text-[#4B5563] hover:text-[#111827] flex items-center justify-center transition-colors shadow-2xs shrink-0 cursor-pointer"
                title="Back to Orders"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-xl font-extrabold text-[#111827] font-mono shrink-0">
                {order.formattedOrderNumber}
              </span>
              <OpsBadge stage={order.opsStage} size="sm" />
              <OpsBadge
                status={order.currentExecution?.status || "PENDING"}
                size="sm"
              />
              {order.orderSource && <OpsBadge source={order.orderSource} size="sm" />}
            </div>
          </div>

          {/* Desktop/Tablet Dedicated View Order Details Button */}
          <button
            type="button"
            onClick={() => setIsDetailsModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-300/80 text-[#065F46] font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#00A86B]" />
            <span>View Full Order Details</span>
            <span className="text-[10px] font-mono bg-emerald-100 px-1.5 py-0.2 rounded-md">
              {order.totalQuantity} pcs
            </span>
          </button>
        </div>

        {/* Mobile Designated Button: Prominent, Uncluttered, 1-Tap Access to Specs & Ledger */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setIsDetailsModalOpen(true)}
            className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-300 text-[#065F46] flex items-center justify-between shadow-xs transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white text-[#00A86B] border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <span>View Order Details</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-[#065F46]">
                    {order.totalQuantity} pcs
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280] truncate">
                  Specs, Sizes Matrix, Address, Ledger & Art
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#00A86B] shrink-0 pl-2">
              <span>Open</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Production Stage Stepper */}
        <StageProgressBar
          currentStage={order.opsStage}
          currentStatus={order.currentExecution?.status}
          iteration={order.currentExecution?.iteration}
        />

        {/* Payment Status & 60% Advance Gate: Compact on Mobile, Full on Desktop */}
        <div className="lg:hidden">
          <Step2PaymentCard
            order={order}
            onPaymentRecorded={fetchOrderDetail}
            compact={true}
          />
        </div>
        <div className="hidden lg:block">
          <Step2PaymentCard
            order={order}
            onPaymentRecorded={fetchOrderDetail}
            compact={false}
          />
        </div>

        {/* Active Worker Tasks on Mobile (Clean Card for Mobile Floor Tracking) */}
        <div className="lg:hidden">
          <OpsCard title="Production Tasks & Delegations">
            <OrderTasksList
              order={order}
              onOpenAssignModal={() => setIsTaskModalOpen(true)}
              onTaskUpdated={fetchOrderDetail}
            />
          </OpsCard>
        </div>

        {/* Metadata Controls Bar */}
        <div className="p-4 rounded-[20px] bg-white border border-[#ECEEF2] flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[#9CA3AF] font-semibold">Priority:</span>
              <select
                value={priority}
                onChange={(e) => {
                  const p = e.target.value as OpsPriority;
                  setPriority(p);
                  handleUpdateMetadata(p, undefined);
                }}
                disabled={isSavingMetadata}
                className="bg-[#F4F6F9] border border-[#ECEEF2] text-[#111827] text-xs font-semibold rounded-full px-3 py-1 outline-none focus:border-[#00A86B]"
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
                <option value="RUSH">Rush</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#9CA3AF] font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#00A86B]" />
                Target Due Date:
              </span>
              <input
                type="date"
                value={dueDateInput}
                onChange={(e) => {
                  setDueDateInput(e.target.value);
                  handleUpdateMetadata(undefined, e.target.value);
                }}
                disabled={isSavingMetadata}
                className="bg-[#F4F6F9] border border-[#ECEEF2] text-[#111827] text-xs font-semibold rounded-full px-3 py-1 outline-none focus:border-[#00A86B]"
              />
            </div>
          </div>

          <div className="text-[#9CA3AF] font-medium text-xs">
            Total Volume: <strong className="text-[#111827] text-sm">{order.totalQuantity} pcs</strong>
          </div>
        </div>

        {/* 2-Column Responsive Workspace Grid (Desktop Only: hidden on mobile to eliminate clutter!) */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Tasks, Customer, Products, Specs, Artwork, Dispatch (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Worker Production Tasks Card */}
            <OpsCard title="Production Delegation & Worker Tasks">
              <OrderTasksList
                order={order}
                onOpenAssignModal={() => setIsTaskModalOpen(true)}
                onTaskUpdated={fetchOrderDetail}
              />
            </OpsCard>

            {/* Customer & Delivery Information Card */}
            <OpsCard title="Customer & Delivery Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2]">
                  <div className="flex items-center gap-1.5 font-bold text-[#111827] mb-2">
                    <User className="w-4 h-4 text-[#00A86B]" />
                    <span>Customer Information</span>
                  </div>
                  <div className="space-y-1 text-[#4B5563]">
                    <div className="font-bold text-sm text-[#111827]">{order.customer.name || "Customer"}</div>
                    {order.customer.companyName && (
                      <div className="text-[#00A86B] font-semibold">
                        {order.customer.companyName}
                      </div>
                    )}
                    <div className="text-[#9CA3AF]">{order.customer.email || "No email"}</div>
                    <div className="text-[#9CA3AF] font-mono">{order.customer.phone || "No phone"}</div>
                    {order.customer.gstNumber && (
                      <div className="text-[#9CA3AF] font-mono text-[11px]">
                        GST: {order.customer.gstNumber}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2]">
                  <div className="flex items-center gap-1.5 font-bold text-[#111827] mb-2">
                    <MapPin className="w-4 h-4 text-[#00A86B]" />
                    <span>Shipping Address</span>
                  </div>
                  {order.shippingAddress ? (
                    <div className="space-y-1 text-[#4B5563] leading-relaxed">
                      <div className="font-bold text-[#111827]">{order.shippingAddress.name}</div>
                      <div>{order.shippingAddress.street}</div>
                      <div>
                        {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                        <strong className="text-[#111827] font-mono">
                          {order.shippingAddress.postalCode}
                        </strong>
                      </div>
                      <div className="text-[#9CA3AF]">{order.shippingAddress.country}</div>
                    </div>
                  ) : (
                    <div className="text-[#9CA3AF] italic">
                      No shipping address recorded on file.
                    </div>
                  )}
                </div>
              </div>
            </OpsCard>

            {/* Garment Products & Size Breakdown Table */}
            <OpsCard title="Garment Specifications & Sizing Breakdown">
              <div className="space-y-5">
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

                        {/* Quantity Badge (shrink-0 + whitespace-nowrap prevents line-wrap and overlap) */}
                        <div className="shrink-0 text-right">
                          <span className="inline-flex items-center justify-center font-mono text-xs sm:text-sm font-bold text-[#00A86B] px-2.5 py-1 rounded-full bg-[#E6F7F0] border border-[#B3E8D3] whitespace-nowrap shadow-2xs">
                            {item.quantity} pcs
                          </span>
                        </div>
                      </div>

                      {/* Branding / Logo Details Badge */}
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
                            <span className="font-semibold text-[#111827]">
                              Logo: {logoName}
                            </span>
                          )}
                          {logoPos && (
                            <span className="text-[#6B7280]">
                              ({logoPos})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Size Matrix Breakdown */}
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
            </OpsCard>

            {/* Artwork & Mockup Preview Card */}
            <OpsCard
              title="Production Artwork & Visual Mockups"
              headerAction={
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={assetFileInputRef}
                    onChange={handleUploadAsset}
                    multiple
                    accept=".cdr,.ai,.eps,.svg,.pdf,.png,.jpg,.jpeg,.psd,.zip"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={mockupFileInputRef}
                    onChange={handleUploadMockup}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => assetFileInputRef.current?.click()}
                    disabled={isUploadingAsset}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#00A86B]/10 text-[#00A86B] hover:bg-[#00A86B]/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingAsset ? "Uploading..." : "Upload Vector / CDR"}</span>
                  </button>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Visual Mockups */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      Garment Placement Mockups
                    </span>
                    <button
                      type="button"
                      onClick={() => mockupFileInputRef.current?.click()}
                      disabled={isUploadingMockup}
                      className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isUploadingMockup ? "Uploading..." : "Add Mockup Photo"}</span>
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
                          onClick={() => mockupFileInputRef.current?.click()}
                          className="p-4 rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F3F4F6] cursor-pointer transition-colors text-center space-y-1.5"
                        >
                          <div className="w-7 h-7 rounded-full bg-white border border-[#E5E7EB] mx-auto flex items-center justify-center text-[#6B7280]">
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
                            className="p-3 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] flex flex-col items-center shadow-2xs"
                          >
                            <div className="w-full aspect-square bg-white border border-[#ECEEF2] rounded-lg overflow-hidden flex items-center justify-center mb-2">
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

                {/* Print Files & Logos */}
                <div className="pt-3 border-t border-[#ECEEF2]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      High-Resolution Print Assets & Logos
                    </span>
                    <button
                      type="button"
                      onClick={() => assetFileInputRef.current?.click()}
                      disabled={isUploadingAsset}
                      className="text-[11px] font-semibold text-[#00A86B] hover:text-[#00925D] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Attach Vector / CDR</span>
                    </button>
                  </div>

                  {(() => {
                    const allFiles = Array.from(
                      new Set(order.items.flatMap((i) => i.printFiles || []))
                    );

                    if (allFiles.length === 0) {
                      return (
                        <div
                          onClick={() => assetFileInputRef.current?.click()}
                          className="p-4 rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F3F4F6] cursor-pointer transition-colors text-center space-y-1.5"
                        >
                          <div className="w-7 h-7 rounded-full bg-white border border-[#E5E7EB] mx-auto flex items-center justify-center text-[#6B7280]">
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
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAsset(fileUrl)}
                                  className="p-1 rounded text-[#9CA3AF] hover:text-red-500 transition-colors"
                                  title="Remove File"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </OpsCard>

            {/* Logistics & Dispatch Card */}
            <OpsCard title="Logistics & Dispatch Information">
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2]">
                    <span className="text-[10px] text-[#9CA3AF] block font-semibold uppercase">
                      Courier Partner
                    </span>
                    <span className="font-bold text-[#111827] mt-0.5 block">
                      {order.courierName || "Bigship Logistics (Pending Booking)"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2]">
                    <span className="text-[10px] text-[#9CA3AF] block font-semibold uppercase">
                      AWB / Tracking Number
                    </span>
                    <span className="font-mono font-bold text-[#111827] mt-0.5 block">
                      {order.awbNumber || "Not generated yet"}
                    </span>
                  </div>
                </div>

                {order.labelUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={order.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-full bg-white text-[#111827] border border-[#ECEEF2] hover:bg-[#F4F6F9] flex items-center gap-2 text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4 text-[#00A86B]" />
                      <span>Download Shipping Label</span>
                    </a>
                  </div>
                )}
              </div>
            </OpsCard>
          </div>

          {/* RIGHT COLUMN: Notes, Activity Timeline, Stage Executions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Internal Staff Notes */}
            <OpsCard title="Internal Team Notes">
              <InternalNotesPanel
                orderId={order.id}
                initialNotes={order.internalNotes}
              />
            </OpsCard>

            {/* Activity Timeline Audit Feed */}
            <OpsCard title="Accountability & Activity Timeline">
              <ActivityTimeline events={activityEvents} />
            </OpsCard>

            {/* Granular Stage Execution History */}
            <OpsCard title="Stage Execution Runs">
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {order.stageExecutions.length === 0 ? (
                  <div className="text-xs text-[#9CA3AF] text-center py-4 italic">
                    No stage executions recorded yet.
                  </div>
                ) : (
                  order.stageExecutions.map((exec) => (
                    <div
                      key={exec.id}
                      className="p-3.5 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] text-xs space-y-1.5"
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
                        <p className="text-[11px] text-[#4B5563] italic bg-white p-2.5 rounded-lg border border-[#ECEEF2]">
                          "{exec.notes}"
                        </p>
                      )}
                      <div className="text-[10px] text-[#9CA3AF] font-mono pt-1 flex justify-between">
                        <span>
                          {new Date(exec.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </OpsCard>
          </div>
        </div>
      </div>

      {/* Advance Stage Modal */}
      <StageActionModal
        orderId={order.id}
        orderNumber={order.orderNumber}
        currentStage={order.opsStage}
        totalAmount={order.totalAmount}
        amountPaid={order.amountPaid}
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onSuccess={fetchOrderDetail}
      />

      {/* Task Assignment Modal for Workers */}
      <TaskAssignmentModal
        order={order}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskAssigned={fetchOrderDetail}
      />

      {/* Defect / Rework Modal */}
      <ReworkModal
        orderId={order.id}
        orderNumber={order.orderNumber}
        isOpen={isReworkModalOpen}
        onClose={() => setIsReworkModalOpen(false)}
        onSuccess={fetchOrderDetail}
      />

      {/* Resource Allocation Modal */}
      <ResourceAllocationModal
        orderId={order.id}
        orderNumber={order.orderNumber}
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        onSuccess={fetchOrderDetail}
      />

      {/* Mobile Docked Sticky Bottom Action Bar (Thumb-friendly, uncluttered) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-[#ECEEF2] z-40 flex items-center gap-2 shadow-lg">
        <button
          type="button"
          onClick={() => setIsTaskModalOpen(true)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-[#F4F6F9] hover:bg-[#E5E7EB] text-[#111827] text-xs font-bold border border-[#ECEEF2] flex items-center justify-center gap-1.5 transition-colors active:scale-98 cursor-pointer"
        >
          <UserCheck className="w-4 h-4 text-[#00A86B]" />
          <span>Assign Task</span>
        </button>

        {isQCStage && (
          <button
            type="button"
            onClick={() => setIsReworkModalOpen(true)}
            className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center justify-center gap-1.5 transition-colors active:scale-98 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Defect</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsAdvanceModalOpen(true)}
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-98 cursor-pointer"
        >
          <span>Advance Stage</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dedicated Comprehensive Order Details Modal (Specs, Sizes, Client, Ledger, Art) */}
      <OrderDetailsModal
        order={order}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        activityEvents={activityEvents}
        onRefresh={fetchOrderDetail}
        onUploadAsset={handleUploadAsset}
        onUploadMockup={handleUploadMockup}
        onRemoveAsset={handleRemoveAsset}
        isUploadingAsset={isUploadingAsset}
        isUploadingMockup={isUploadingMockup}
        assetFileInputRef={assetFileInputRef}
        mockupFileInputRef={mockupFileInputRef}
      />
    </OpsLayout>
  );
}
