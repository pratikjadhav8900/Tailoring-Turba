"use client";

import React, { useState, useEffect } from "react";
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
import type { OpsOrder, OpsActivityEvent, OpsPriority } from "@/types/ops";
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Layers,
  ChevronRight,
  ExternalLink,
  Download,
  Truck,
  User,
  MapPin,
  CheckCircle,
  Clock,
  Printer,
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

  // Metadata edit states
  const [priority, setPriority] = useState<OpsPriority>("NORMAL");
  const [dueDateInput, setDueDateInput] = useState<string>("");
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

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

  if (loading) {
    return (
      <OpsLayout pageTitle="Loading Order...">
        <OpsLoadingState message="Fetching single source of truth order record..." />
      </OpsLayout>
    );
  }

  if (!order) {
    return (
      <OpsLayout pageTitle="Order Not Found">
        <div className="p-8 text-center text-slate-400">
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
    <OpsLayout pageTitle={`Order ${order.formattedOrderNumber}`}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Navigation & Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e2230]">
          <div className="flex items-center gap-3">
            <Link href="/ops/orders">
              <button className="p-1.5 rounded bg-[#10121a] hover:bg-[#161825] border border-[#1e2230] text-slate-400 hover:text-slate-100 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-mono tracking-tight text-slate-100">
                  {order.formattedOrderNumber}
                </h2>
                <OpsBadge stage={order.opsStage} />
                <OpsBadge
                  status={order.currentExecution?.status || "PENDING"}
                />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Created on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })} • Source: {order.orderSource || "Website"}
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <OpsButton
              variant="secondary"
              size="sm"
              onClick={() => setIsResourceModalOpen(true)}
              leftIcon={<Layers className="w-3.5 h-3.5 text-amber-400" />}
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
                Flag Defect / Rework
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
        </div>

        {/* Production Stage Visual Progress Bar */}
        <StageProgressBar
          currentStage={order.opsStage}
          currentStatus={order.currentExecution?.status}
          iteration={order.currentExecution?.iteration}
        />

        {/* Metadata Controls Bar (Priority & Due Date Editor) */}
        <div className="p-3 rounded-lg bg-[#10121a] border border-[#1e2230] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Priority:</span>
              <select
                value={priority}
                onChange={(e) => {
                  const p = e.target.value as OpsPriority;
                  setPriority(p);
                  handleUpdateMetadata(p, undefined);
                }}
                disabled={isSavingMetadata}
                className="bg-[#0b0d13] border border-[#1e2230] text-slate-200 text-xs rounded px-2 py-1 outline-none"
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
                <option value="RUSH">Rush</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
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
                className="bg-[#0b0d13] border border-[#1e2230] text-slate-200 text-xs rounded px-2 py-1 outline-none"
              />
            </div>
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            Total Manufacturing Volume: <strong className="text-slate-200">{order.totalQuantity} pcs</strong>
          </div>
        </div>

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Customer, Products, Specs, Artwork, Dispatch (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer & Delivery Information Card */}
            <OpsCard title="Customer & Delivery Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>Customer Information</span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div>{order.customer.name || "Customer"}</div>
                    {order.customer.companyName && (
                      <div className="text-slate-400 font-medium">
                        {order.customer.companyName}
                      </div>
                    )}
                    <div className="text-slate-400">{order.customer.email || "No email"}</div>
                    <div className="text-slate-400">{order.customer.phone || "No phone"}</div>
                    {order.customer.gstNumber && (
                      <div className="text-slate-400 font-mono">
                        GST: {order.customer.gstNumber}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Shipping Address</span>
                  </div>
                  {order.shippingAddress ? (
                    <div className="space-y-0.5 text-slate-300 leading-relaxed">
                      <div>{order.shippingAddress.name}</div>
                      <div>{order.shippingAddress.street}</div>
                      <div>
                        {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                        <strong className="text-slate-200 font-mono">
                          {order.shippingAddress.postalCode}
                        </strong>
                      </div>
                      <div>{order.shippingAddress.country}</div>
                    </div>
                  ) : (
                    <div className="text-slate-500">
                      No shipping address recorded on file.
                    </div>
                  )}
                </div>
              </div>
            </OpsCard>

            {/* Garment Products & Size Breakdown Table */}
            <OpsCard title="Garment Specifications & Sizing Breakdown">
              <div className="space-y-6">
                {order.items.map((item, idx) => {
                  const sizes = item.customState?.sizes || {};
                  const sizeKeys = Object.keys(sizes);

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-lg bg-[#0b0d13] border border-[#1e2230] space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-100">
                            #{idx + 1} — {item.productName}
                          </h4>
                          <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                            {item.fabric && <span>Fabric: {item.fabric}</span>}
                            {item.gsm && <span>GSM: {item.gsm}</span>}
                            {item.fit && <span>Fit: {item.fit}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm font-bold text-amber-400">
                            {item.quantity} pcs
                          </span>
                        </div>
                      </div>

                      {/* Size Matrix Breakdown */}
                      {sizeKeys.length > 0 ? (
                        <div>
                          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                            Cutting Size Breakdown
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                            {sizeKeys.map((size) => (
                              <div
                                key={size}
                                className="p-1.5 rounded bg-[#131520] border border-[#1e2230] text-center"
                              >
                                <div className="text-[10px] text-slate-400 font-bold uppercase">
                                  {size}
                                </div>
                                <div className="text-xs font-bold font-mono text-slate-100">
                                  {sizes[size]}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">
                          Total Quantity: {item.quantity} pcs (No segmented size matrix specified).
                        </div>
                      )}

                      {/* Print Tech Specifications */}
                      {item.customState?.printTechnology && (
                        <div className="text-xs text-slate-300 flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                          <Printer className="w-3.5 h-3.5 text-purple-400" />
                          <span>
                            Print Method: <strong>{item.customState.printTechnology}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </OpsCard>

            {/* Artwork & Mockup Preview Card */}
            <OpsCard title="Production Artwork & Visual Mockups">
              <div className="space-y-4">
                {/* Visual Mockups */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-300 mb-2">
                    Garment Placement Mockups
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {order.items.flatMap((item) =>
                      [
                        { label: "Front", url: item.mockupUrl },
                        { label: "Back", url: item.mockupUrlBack },
                        { label: "Left Sleeve", url: item.mockupUrlLeft },
                        { label: "Right Sleeve", url: item.mockupUrlRight },
                      ].filter((m) => !!m.url)
                    ).map((m, i) => (
                      <div
                        key={i}
                        className="p-2 rounded bg-[#0b0d13] border border-[#1e2230] flex flex-col items-center"
                      >
                        <div className="w-full aspect-square bg-[#10121a] rounded overflow-hidden flex items-center justify-center mb-1">
                          <img
                            src={m.url!}
                            alt={m.label}
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Print Files */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-300 mb-2">
                    High-Resolution Print Assets
                  </div>
                  {order.items.flatMap((i) => i.printFiles).length === 0 ? (
                    <div className="text-xs text-slate-500">
                      No external print vector files attached to items.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {order.items.flatMap((i) => i.printFiles).map((fileUrl, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded bg-[#0b0d13] border border-[#1e2230] flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-300 font-mono truncate max-w-sm">
                            {fileUrl.split("/").pop()}
                          </span>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open File</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </OpsCard>

            {/* Logistics & Dispatch Card */}
            <OpsCard title="Logistics & Dispatch Information">
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded bg-[#0b0d13] border border-[#1e2230]">
                    <span className="text-[10px] text-slate-500 block uppercase">
                      Courier Partner
                    </span>
                    <span className="font-semibold text-slate-200">
                      {order.courierName || "Bigship Logistics (Pending Booking)"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#0b0d13] border border-[#1e2230]">
                    <span className="text-[10px] text-slate-500 block uppercase">
                      AWB / Tracking Number
                    </span>
                    <span className="font-mono font-semibold text-slate-200">
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
                      className="px-3 py-1.5 rounded bg-[#1c202d] text-slate-200 border border-[#2a3044] hover:bg-[#252b3d] flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
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
                  <div className="text-xs text-slate-500 text-center py-4">
                    No stage executions recorded yet.
                  </div>
                ) : (
                  order.stageExecutions.map((exec) => (
                    <div
                      key={exec.id}
                      className="p-2.5 rounded bg-[#0b0d13] border border-[#1e2230] text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">
                          {exec.stage} (Iteration #{exec.iteration})
                        </span>
                        <OpsBadge status={exec.status} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Operator: <strong className="text-slate-300">{exec.employeeName}</strong>
                      </div>
                      {exec.notes && (
                        <p className="text-[11px] text-slate-300 mt-1 italic">
                          "{exec.notes}"
                        </p>
                      )}
                      <div className="text-[10px] text-slate-500 mt-1.5 flex justify-between">
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
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onSuccess={fetchOrderDetail}
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
    </OpsLayout>
  );
}
