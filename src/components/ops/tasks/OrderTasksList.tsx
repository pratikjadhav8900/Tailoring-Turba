"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Check,
  Clock,
  Plus,
  Building2,
  FileText,
  User,
  Zap,
} from "lucide-react";
import { PunchDoneModal } from "./PunchDoneModal";
import type { OpsOrder, OpsTaskItem } from "@/types/ops";
import { STAGE_DISPLAY_NAMES } from "@/lib/ops/workflow";

interface OrderTasksListProps {
  order: OpsOrder;
  onOpenAssignModal: () => void;
  onTaskUpdated: () => void;
}

export const OrderTasksList: React.FC<OrderTasksListProps> = ({
  order,
  onOpenAssignModal,
  onTaskUpdated,
}) => {
  const [selectedTaskForDone, setSelectedTaskForDone] = useState<OpsTaskItem | null>(null);

  // Derive tasks from order.stageExecutions
  const tasks: OpsTaskItem[] = (order.stageExecutions || []).map((exec) => {
    const meta = (exec.metadata as Record<string, any>) || {};
    const title = meta.taskTitle || meta.title || STAGE_DISPLAY_NAMES[exec.stage] || exec.stage;

    return {
      id: exec.id,
      orderId: exec.orderId,
      orderNumber: order.orderNumber,
      formattedOrderNumber: `TT-${order.orderNumber}`,
      stage: exec.stage,
      taskKey: meta.taskKey || exec.stage,
      title,
      status: exec.status,
      iteration: exec.iteration,
      employeeId: exec.employeeId,
      employeeName: exec.employeeName,
      assignedBy: meta.assignedByName || "Management",
      instructions: meta.instructions || exec.notes || "",
      notes: exec.notes,
      vendorName: meta.vendorName || null,
      vendorCost: meta.vendorCost || null,
      startedAt: exec.startedAt,
      completedAt: exec.completedAt,
      createdAt: exec.createdAt,
      orderTotalPieces: order.totalQuantity,
    };
  });

  return (
    <div className="space-y-3">
      {/* Header with Assign Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
            Worker Production Tasks
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563]">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenAssignModal}
          className="px-3 py-1.5 rounded-xl bg-[#00A86B]/10 hover:bg-[#00A86B]/20 text-[#00A86B] text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Assign Task to Worker</span>
        </button>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div
          onClick={onOpenAssignModal}
          className="p-6 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-center cursor-pointer space-y-1.5"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] mx-auto flex items-center justify-center text-[#6B7280]">
            <UserCheck className="w-4 h-4 text-[#00A86B]" />
          </div>
          <div className="text-xs font-semibold text-[#111827]">
            No worker tasks assigned yet
          </div>
          <p className="text-[11px] text-[#6B7280]">
            Click here to assign Procurement, Stitching, or Print/Embroidery to Ajay or Mahesh.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const isCompleted = task.status === "COMPLETED";

            return (
              <div
                key={task.id}
                className={`p-3.5 sm:p-4 rounded-xl border text-xs transition-all ${
                  isCompleted
                    ? "bg-emerald-50/40 border-emerald-200"
                    : "bg-white border-[#ECEEF2] shadow-2xs hover:border-[#CBD5E1]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCompleted ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                      }`}
                    />
                    <h5 className="font-bold text-xs text-[#111827]">
                      {task.title}
                    </h5>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isCompleted ? "✓ Completed" : "In Progress"}
                    </span>
                  </div>

                  {/* Worker Badge */}
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4B5563] bg-[#F4F6F9] px-2.5 py-1 rounded-lg border border-[#E5E7EB]">
                    <User className="w-3 h-3 text-[#00A86B]" />
                    <span>Worker: <strong>{task.employeeName}</strong></span>
                  </div>
                </div>

                {/* Instructions / Notes */}
                {task.instructions && (
                  <p className="text-[11px] text-[#4B5563] mb-2 leading-relaxed">
                    {task.instructions}
                  </p>
                )}

                {/* Vendor Details (if completed with vendor info) */}
                {task.vendorName && (
                  <div className="flex items-center gap-2 text-[11px] font-medium text-[#1F2937] bg-white/80 p-2 rounded-lg border border-[#E5E7EB] mb-2">
                    <Building2 className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />
                    <span>
                      Done from: <strong>{task.vendorName}</strong>
                      {task.vendorCost ? ` (₹${task.vendorCost})` : ""}
                    </span>
                  </div>
                )}

                {/* Action / Completion Details */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6] text-[10px] text-[#9CA3AF]">
                  <span>
                    {isCompleted && task.completedAt
                      ? `Completed on ${new Date(task.completedAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : `Assigned by ${task.assignedBy}`}
                  </span>

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => setSelectedTaskForDone(task)}
                      className="px-3 py-1 rounded-lg bg-[#00A86B] hover:bg-[#00925d] text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Punch Done</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Punch Done Modal */}
      {selectedTaskForDone && (
        <PunchDoneModal
          task={selectedTaskForDone}
          isOpen={!!selectedTaskForDone}
          onClose={() => setSelectedTaskForDone(null)}
          onSuccess={() => {
            setSelectedTaskForDone(null);
            onTaskUpdated();
          }}
        />
      )}
    </div>
  );
};
