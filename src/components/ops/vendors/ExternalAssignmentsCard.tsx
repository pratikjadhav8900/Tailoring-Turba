"use client";

import React, { useState } from "react";
import {
  Building2,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertTriangle,
  User,
  Plus,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  History,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import type { OpsOrder, OpsExternalWorkAssignment, OpsGoodsMovement } from "@/types/ops";
import { GoodsMovementModal } from "./GoodsMovementModal";

interface ExternalAssignmentsCardProps {
  order: OpsOrder;
  onRefresh: () => void;
  onOpenAssignModal?: () => void;
  isManager?: boolean;
}

export const ExternalAssignmentsCard: React.FC<ExternalAssignmentsCardProps> = ({
  order,
  onRefresh,
  onOpenAssignModal,
  isManager = false,
}) => {
  const [selectedAssignmentForMovement, setSelectedAssignmentForMovement] =
    useState<OpsExternalWorkAssignment | null>(null);
  const [expandedLedgerId, setExpandedLedgerId] = useState<string | null>(null);

  const assignments = order.externalAssignments || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RECEIVED":
        return {
          bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          label: "✓ Received / Done",
        };
      case "PARTIALLY_RECEIVED":
        return {
          bg: "bg-amber-100 text-amber-800 border-amber-200",
          label: "Partially Received",
        };
      case "SENT_TO_PARTNER":
        return {
          bg: "bg-blue-100 text-blue-800 border-blue-200",
          label: "With Partner",
        };
      case "IN_PROGRESS":
        return {
          bg: "bg-purple-100 text-purple-800 border-purple-200",
          label: "In Progress",
        };
      case "ASSIGNED":
        return {
          bg: "bg-gray-100 text-gray-800 border-gray-200",
          label: "Assigned",
        };
      case "CANCELLED":
        return {
          bg: "bg-red-100 text-red-800 border-red-200",
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-gray-100 text-gray-700 border-gray-200",
          label: status,
        };
    }
  };

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case "RESOURCE_FABRIC":
        return "Raw Material Procurement";
      case "CUTTING":
        return "Fabric Cutting";
      case "STITCHING":
        return "Tailoring & Stitching";
      case "BRANDING_PRINTING":
        return "Printing & Embroidery";
      default:
        return stage.replace(/_/g, " ");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-0.5">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#00A86B]" />
          <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
            External Partners & Outsourced Production
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563]">
            {assignments.length} {assignments.length === 1 ? "partner" : "partners"}
          </span>
        </div>

        {isManager && onOpenAssignModal && (
          <button
            type="button"
            onClick={onOpenAssignModal}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-[#00A86B]/10 hover:bg-[#00A86B]/20 text-[#00A86B] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign External Work</span>
          </button>
        )}
      </div>

      {/* Assignment List */}
      {assignments.length === 0 ? (
        <div
          onClick={isManager && onOpenAssignModal ? onOpenAssignModal : undefined}
          className={`p-6 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] text-center space-y-1.5 ${
            isManager && onOpenAssignModal ? "hover:bg-[#F3F4F6] cursor-pointer" : ""
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] mx-auto flex items-center justify-center text-[#6B7280]">
            <Building2 className="w-4 h-4 text-[#00A86B]" />
          </div>
          <div className="text-xs font-semibold text-[#111827]">
            No external partners assigned to this order yet
          </div>
          <p className="text-[11px] text-[#6B7280]">
            When Neeraj, Pratik, or Sanjay outsources stitching, fabric procurement, or printing,
            assignments and goods challans will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {assignments.map((assignment) => {
            const statusBadge = getStatusBadge(assignment.status);
            const sent = assignment.quantitySent || 0;
            const received = assignment.quantityReceived || 0;
            const pending = Math.max(0, sent - received);
            const percentReceived = sent > 0 ? Math.min(100, Math.round((received / sent) * 100)) : 0;
            const isOverdue =
              assignment.expectedDeliveryDate &&
              new Date(assignment.expectedDeliveryDate) < new Date() &&
              !["COMPLETED", "RECEIVED", "CANCELLED"].includes(assignment.status);

            const isLedgerOpen = expandedLedgerId === assignment.id;
            const movements = assignment.goodsMovements || [];

            return (
              <div
                key={assignment.id}
                className="p-4 rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs hover:border-[#CBD5E1] transition-all space-y-3.5 text-xs"
              >
                {/* Header: Stage + Partner Code + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F3F4F6]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#111827]">
                        {getStageTitle(assignment.stage)}
                      </span>
                      {(assignment.assignmentType || assignment.workType) && (
                        <span className="text-[10px] text-[#6B7280] font-mono bg-[#F4F6F9] px-2 py-0.5 rounded border border-[#ECEEF2]">
                          {(assignment.assignmentType || assignment.workType).replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-0.5">
                      <span>Assigned by: <strong className="text-[#374151]">{assignment.assignedByName || "Management"}</strong></span>
                      {assignment.assignedWorkerName && (
                        <span>• Internal lead: <strong className="text-[#374151]">{assignment.assignedWorkerName}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOverdue && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        Overdue
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                {/* Partner Details Box */}
                <div className="p-3 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-[#111827]">
                      <Building2 className="w-4 h-4 text-[#00A86B] shrink-0" />
                      <span>{assignment.vendorName}</span>
                    </div>
                    {assignment.vendorCode && (
                      <div className="text-[11px] font-mono text-[#00A86B] font-bold">
                        Code: {assignment.vendorCode}
                      </div>
                    )}
                    {assignment.vendorLocation && (
                      <div className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                        <MapPin className="w-3 h-3 text-[#9CA3AF]" />
                        <span>{assignment.vendorLocation}</span>
                      </div>
                    )}
                    {assignment.vendorPhone && (
                      <div className="flex items-center gap-1 text-[11px] text-[#6B7280] font-mono">
                        <Phone className="w-3 h-3 text-[#9CA3AF]" />
                        <span>{assignment.vendorPhone}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:border-l sm:border-[#ECEEF2] sm:pl-3">
                    {(assignment.serviceRequested || assignment.serviceOrProduct) && (
                      <div className="text-[11px] text-[#374151]">
                        <span className="text-[#6B7280] font-medium">Service / Work: </span>
                        <strong>{assignment.serviceRequested || assignment.serviceOrProduct}</strong>
                      </div>
                    )}
                    {assignment.materialSpecs && (
                      <div className="text-[11px] text-[#374151]">
                        <span className="text-[#6B7280] font-medium">Material/Specs: </span>
                        <span>{assignment.materialSpecs}</span>
                      </div>
                    )}
                    {assignment.expectedDeliveryDate && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#374151]">
                        <Calendar className="w-3 h-3 text-[#00A86B]" />
                        <span>
                          Expected Return:{" "}
                          <strong
                            className={isOverdue ? "text-red-600 font-bold" : "text-[#111827]"}
                          >
                            {new Date(assignment.expectedDeliveryDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Goods Movement Progress & Stats */}
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-white border border-[#E5E7EB]">
                      <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-bold">
                        Sent to Partner
                      </span>
                      <span className="text-sm font-extrabold text-[#111827]">
                        {sent} <span className="text-[10px] font-normal text-[#6B7280]">{assignment.unit || "pcs"}</span>
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-[#E5E7EB]">
                      <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-bold">
                        Received Back
                      </span>
                      <span className="text-sm font-extrabold text-[#00A86B]">
                        {received} <span className="text-[10px] font-normal text-[#6B7280]">{assignment.unit || "pcs"}</span>
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-[#E5E7EB]">
                      <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-bold">
                        Pending Goods
                      </span>
                      <span
                        className={`text-sm font-extrabold ${
                          pending > 0 ? "text-amber-600" : "text-[#9CA3AF]"
                        }`}
                      >
                        {pending} <span className="text-[10px] font-normal text-[#6B7280]">{assignment.unit || "pcs"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {sent > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#6B7280] font-semibold">
                        <span>Fulfillment</span>
                        <span>{percentReceived}% received</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            percentReceived === 100 ? "bg-[#00A86B]" : "bg-amber-500"
                          }`}
                          style={{ width: `${percentReceived}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions / Notes if present */}
                {assignment.notes && (
                  <div className="text-[11px] text-[#4B5563] italic bg-[#F9FAFB] p-2.5 rounded-xl border border-[#ECEEF2]">
                    <span className="font-semibold not-italic text-[#374151] block mb-0.5">
                      Partner / Assignment Notes:
                    </span>
                    "{assignment.notes}"
                  </div>
                )}

                {/* Actions Bar */}
                <div className="pt-2 border-t border-[#F3F4F6] flex flex-wrap items-center justify-between gap-2">
                  {/* Ledger Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedLedgerId(isLedgerOpen ? null : assignment.id)
                    }
                    className="text-[11px] font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span>Challan Ledger ({movements.length})</span>
                    {isLedgerOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Record Goods Movement Action Button */}
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => setSelectedAssignmentForMovement(assignment)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-98 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Record Goods Movement</span>
                    </button>
                  )}
                </div>

                {/* Expandable Goods Movement Ledger */}
                {isLedgerOpen && (
                  <div className="mt-2 p-3 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-2 animate-fadeIn">
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
                      Goods Movement & Challan History
                    </span>
                    {movements.length === 0 ? (
                      <div className="text-xs text-[#9CA3AF] py-2 text-center">
                        No goods movements recorded yet. Issue an outward challan or log incoming goods.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {movements.map((m: OpsGoodsMovement) => (
                          <div
                            key={m.id}
                            className="p-2 rounded-lg bg-white border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {m.movementType === "OUTWARD_CHALLAN" ? (
                                <span className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="p-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <div>
                                <span className="font-bold text-[#111827]">
                                  {m.movementType === "OUTWARD_CHALLAN"
                                    ? "Challan Outward"
                                    : "Inward Receipt"}
                                  :
                                </span>{" "}
                                <strong
                                  className={
                                    m.movementType === "OUTWARD_CHALLAN"
                                      ? "text-amber-700"
                                      : "text-[#00A86B]"
                                  }
                                >
                                  {m.quantity} {assignment.unit || "pcs"}
                                </strong>
                                {m.challanNumber && (
                                  <span className="ml-2 font-mono text-[10px] text-[#6B7280] bg-[#F4F6F9] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                                    #{m.challanNumber}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                              {m.employeeName && <span>By: {m.employeeName}</span>}
                              <span>
                                {new Date(m.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Goods Movement Modal */}
      {selectedAssignmentForMovement && (
        <GoodsMovementModal
          assignment={selectedAssignmentForMovement}
          isOpen={!!selectedAssignmentForMovement}
          onClose={() => setSelectedAssignmentForMovement(null)}
          onSuccess={() => {
            setSelectedAssignmentForMovement(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
