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
  currentEmployee?: {
    id: string;
    employeeCode: string;
    name: string;
    roleTitle?: string;
  } | null;
  currentUserRole?: string | null;
  isManager?: boolean;
}

export const OrderTasksList: React.FC<OrderTasksListProps> = ({
  order,
  onOpenAssignModal,
  onTaskUpdated,
  currentEmployee,
  currentUserRole,
  isManager: propIsManager,
}) => {
  const [selectedTaskForDone, setSelectedTaskForDone] = useState<OpsTaskItem | null>(null);
  const [punchOnBehalf, setPunchOnBehalf] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    employeeCode: string;
    name: string;
  } | null>(currentEmployee || null);

  React.useEffect(() => {
    if (currentEmployee) {
      setCurrentUser(currentEmployee);
      return;
    }
    fetch("/api/ops/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.authenticated && d.employee) {
          setCurrentUser(d.employee);
        }
      })
      .catch(() => {});
  }, [currentEmployee]);

  const isManager = propIsManager !== undefined ? propIsManager : Boolean(
    currentUserRole === "ADMIN" ||
    currentUserRole === "SUPER_ADMIN" ||
    ["TT001", "TT002", "TT003"].includes(currentUser?.employeeCode || "") ||
    currentUser?.name?.includes("Pratik") ||
    currentUser?.name?.includes("Neeraj") ||
    currentUser?.name?.includes("Sanjay")
  );

  const getRoleLabel = (name?: string) => {
    if (!name) return "Worker";
    if (name.includes("Neeraj")) return "Founder";
    if (name.includes("Sanjay")) return "Co-Founder";
    if (name.includes("Pratik")) return "Tech & Ops";
    return "Worker";
  };

  // Derive worker tasks from order.stageExecutions
  // Only display genuine assigned worker tasks, NOT macro stage progression milestones
  const tasks: OpsTaskItem[] = (order.stageExecutions || [])
    .filter((exec) => {
      const meta = (exec.metadata as Record<string, any>) || {};
      // Exclude macro stage progression milestones
      if (meta.isStageMilestone) return false;
      // An assigned worker task must have a task title, task key, assignedById, or explicit task assignment metadata
      if (!meta.taskTitle && !meta.taskKey && !meta.assignedById && !meta.isExplicitTask && !meta.assignedWorkerName) {
        return false;
      }
      return true;
    })
    .map((exec) => {
    const meta = (exec.metadata as Record<string, any>) || {};
    const title = meta.taskTitle || meta.title || STAGE_DISPLAY_NAMES[exec.stage] || exec.stage;
    const workerNote = meta.workerNote || (exec.notes && exec.notes !== meta.instructions ? exec.notes : null);

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
      notes: workerNote || exec.notes,
      vendorName: meta.vendorName || null,
      vendorCost: meta.vendorCost || null,
      startedAt: exec.startedAt,
      completedAt: exec.completedAt,
      createdAt: exec.createdAt,
      orderTotalPieces: order.totalQuantity,
    };
  });

  return (
    <div className="space-y-3.5">
      {/* Header with Assign Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
            Worker Production Tasks
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563]">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {isManager && (
          <button
            type="button"
            onClick={onOpenAssignModal}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#00A86B]/10 hover:bg-[#00A86B]/20 text-[#00A86B] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Task to Worker</span>
          </button>
        )}
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        isManager ? (
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
          <div className="p-6 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] text-center space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] mx-auto flex items-center justify-center text-[#6B7280]">
              <UserCheck className="w-4 h-4 text-[#9CA3AF]" />
            </div>
            <div className="text-xs font-semibold text-[#111827]">
              No tasks assigned to this order yet
            </div>
            <p className="text-[11px] text-[#6B7280]">
              Tasks will appear here once assigned by the factory supervisor.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isCompleted = task.status === "COMPLETED";

            const isProcurementTask =
              task.stage === "RESOURCE_FABRIC" ||
              task.title?.toLowerCase().includes("procure") ||
              task.taskKey?.toLowerCase().includes("procure");
            const isAssignedToCurrent = Boolean(
              currentUser?.id && task.employeeId && currentUser.id === task.employeeId
            );
            const canEditTask = isAssignedToCurrent || isManager;

            return (
              <div
                key={task.id}
                className={`p-3.5 sm:p-4 rounded-2xl border text-xs transition-all space-y-3 ${
                  isCompleted
                    ? "bg-emerald-50/40 border-emerald-200"
                    : "bg-white border-[#E5E7EB] shadow-2xs hover:border-[#CBD5E1]"
                }`}
              >
                {/* Header: Title + Status Pill on top, Assignee metadata clean below */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isCompleted ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                        }`}
                      />
                      <h5 className="font-bold text-xs sm:text-sm text-[#111827] truncate">
                        {task.title}
                      </h5>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isCompleted ? "✓ Completed" : "In Progress"}
                    </span>
                  </div>

                  {/* Worker & Assignment Meta Row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 text-[11px] text-[#6B7280]">
                    <div className="inline-flex items-center gap-1.5 font-medium text-[#374151] bg-[#F4F6F9] px-2.5 py-1 rounded-lg border border-[#E5E7EB]">
                      <User className="w-3 h-3 text-[#00A86B] shrink-0" />
                      <span>
                        {getRoleLabel(task.employeeName)}: <strong className="text-[#111827]">{task.employeeName}</strong>
                      </span>
                    </div>

                    <span className="text-[10px] text-[#9CA3AF]">
                      {isCompleted && task.completedAt
                        ? `Done ${new Date(task.completedAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : `Assigned by ${task.assignedBy}`}
                    </span>
                  </div>
                </div>

                {/* Instructions / Notes (if management provided) */}
                {task.instructions && (
                  <div className="p-2.5 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] text-[11px] text-[#4B5563] leading-relaxed">
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-0.5">
                      Instructions:
                    </span>
                    <p>{task.instructions}</p>
                  </div>
                )}

                {/* Vendor / Procurement Details (if completed or saved with vendor info) */}
                {task.vendorName && (
                  <div className="flex items-center gap-2 text-xs font-medium text-[#1F2937] bg-white/80 p-2.5 rounded-xl border border-[#E5E7EB]">
                    <Building2 className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />
                    <span>
                      {isProcurementTask ? "Procured from:" : "Done from:"}{" "}
                      <strong className="text-[#111827]">{task.vendorName}</strong>
                      {task.vendorCost ? ` (₹${task.vendorCost})` : ""}
                    </span>
                  </div>
                )}

                {/* Worker Completion / Progress Note (if distinct from instructions) */}
                {task.notes && task.notes !== task.instructions && (
                  <div className="text-[11px] text-[#4B5563] italic bg-[#F9FAFB] p-2.5 rounded-xl border border-[#ECEEF2]">
                    <span className="font-semibold not-italic text-[#374151] block mb-0.5">
                      {isProcurementTask ? "Procurement Note:" : "Worker Note:"}
                    </span>
                    "{task.notes}"
                  </div>
                )}

                {/* Bottom Action: Punch Done */}
                {!isCompleted && (
                  <div className="pt-2 border-t border-[#F3F4F6] flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                    {currentUser?.id && task.employeeId && currentUser.id === task.employeeId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPunchOnBehalf(false);
                          setSelectedTaskForDone(task);
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-98 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Punch Done</span>
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center justify-center sm:justify-start gap-1">
                          <Clock className="w-3 h-3 text-amber-600 animate-pulse shrink-0" />
                          <span>Awaiting {task.employeeName}</span>
                        </span>

                        {isManager && (
                          <button
                            type="button"
                            onClick={() => {
                              setPunchOnBehalf(true);
                              setSelectedTaskForDone(task);
                            }}
                            className="w-full sm:w-auto text-[11px] font-semibold text-[#6B7280] hover:text-[#111827] px-3 py-1.5 rounded-lg hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-colors text-center cursor-pointer"
                            title={`Record completion on behalf of ${task.employeeName}`}
                          >
                            Punch on Behalf
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
          isPunchingOnBehalf={punchOnBehalf}
          initialNotes={selectedTaskForDone.notes && selectedTaskForDone.notes !== selectedTaskForDone.instructions ? selectedTaskForDone.notes : ""}
          initialVendorName={selectedTaskForDone.vendorName || ""}
          onClose={() => {
            setSelectedTaskForDone(null);
            setPunchOnBehalf(false);
          }}
          onSuccess={() => {
            setSelectedTaskForDone(null);
            setPunchOnBehalf(false);
            onTaskUpdated();
          }}
        />
      )}
    </div>
  );
};
