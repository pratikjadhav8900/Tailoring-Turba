"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserCheck,
  Check,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { STAGE_SUBTASKS, STAGE_DISPLAY_NAMES } from "@/lib/ops/workflow";
import type { OpsOrder, OpsProductionStage } from "@/types/ops";
import { VendorSelectDropdown } from "@/components/ops/vendors/VendorSelectDropdown";

interface TaskAssignmentModalProps {
  order: OpsOrder;
  isOpen: boolean;
  onClose: () => void;
  onTaskAssigned: () => void;
}

interface WorkerOption {
  id: string;
  employeeCode: string;
  name: string;
  roleTitle: string;
}

interface TaskDraft {
  stage: OpsProductionStage;
  taskKey: string;
  title: string;
  assignedToId: string;
  instructions: string;
  vendorId?: string;
  vendorName?: string;
}

const STANDARD_WORKER_TASKS: Array<{
  stage: OpsProductionStage;
  key: string;
  title: string;
  defaultDescription: string;
}> = [
  {
    stage: "RESOURCE_FABRIC",
    key: "FABRIC_PROCUREMENT",
    title: "Fabric Procurement",
    defaultDescription: "Source & verify fabric meterage, color matching & GSM.",
  },
  {
    stage: "RESOURCE_FABRIC",
    key: "STITCHING",
    title: "Garment Stitching",
    defaultDescription: "Pattern cutting and garment stitching per size breakdown.",
  },
  {
    stage: "BRANDING_PRINTING",
    key: "PRINT_EMBROIDERY",
    title: "Print / Embroidery",
    defaultDescription: "Execute printing/embroidery placement with vendor or in-house.",
  },
  {
    stage: "PACKING",
    key: "KAJE_BUTTON",
    title: "Kaje Button",
    defaultDescription: "Execute buttonholes (kaje) and stitch buttons on all pieces.",
  },
  {
    stage: "PACKING",
    key: "PRESSING_PACKING",
    title: "Press & Pack",
    defaultDescription: "Steam press / iron, attach brand tags, polybag packing.",
  },
  {
    stage: "DISPATCHED",
    key: "DISPATCH",
    title: "Dispatch Run",
    defaultDescription: "Weigh carton, generate shipping label / courier handover.",
  },
];

export const TaskAssignmentModal: React.FC<TaskAssignmentModalProps> = ({
  order,
  isOpen,
  onClose,
  onTaskAssigned,
}) => {
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active production stage (if order is in Step 1 or 2, default production tasks to Step 3 Procurement)
  const activeStage: OpsProductionStage =
    order.opsStage === "NEW_ORDER" || order.opsStage === "ORDER_CONFIRMED" || !order.opsStage
      ? "RESOURCE_FABRIC"
      : order.opsStage;

  const defaultTemplates = STAGE_SUBTASKS[activeStage] || [];
  const [selectedTasks, setSelectedTasks] = useState<TaskDraft[]>([]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchWorkers = async () => {
      setLoadingWorkers(true);
      try {
        const res = await fetch("/api/ops/employees");
        if (res.ok) {
          const data = await res.json();
          const workerList: WorkerOption[] = data.workers || [];
          setWorkers(workerList);

          // Initialize first default task template (always a real floor task)
          const firstWorkerId = workerList[0]?.id || "";
          const firstTemplate =
            defaultTemplates.length > 0 ? defaultTemplates[0] : STANDARD_WORKER_TASKS[0];

          setSelectedTasks([
            {
              stage: firstTemplate.stage,
              taskKey: firstTemplate.key,
              title: firstTemplate.title,
              assignedToId: firstWorkerId,
              instructions: firstTemplate.defaultDescription,
            },
          ]);
        }
      } catch (e) {
        console.error("Failed to fetch workers", e);
      } finally {
        setLoadingWorkers(false);
      }
    };

    fetchWorkers();
  }, [isOpen, activeStage]);

  if (!isOpen) return null;

  const handleAddTaskDraft = (stage: OpsProductionStage, templateKey?: string, title?: string, desc?: string) => {
    const defaultWorkerId = workers[0]?.id || "";
    // Non-production stages (NEW_ORDER, ORDER_CONFIRMED) route to first factory stage
    const effectiveStage =
      stage === "NEW_ORDER" || stage === "ORDER_CONFIRMED" ? "RESOURCE_FABRIC" : stage;

    setSelectedTasks((prev) => [
      ...prev,
      {
        stage: effectiveStage,
        taskKey: templateKey || effectiveStage,
        title: title || (STANDARD_WORKER_TASKS.find((t) => t.stage === effectiveStage)?.title) || "Production Task",
        assignedToId: defaultWorkerId,
        instructions: desc || "",
      },
    ]);
  };

  const handleAddNextParallelTask = () => {
    const defaultWorkerId = workers[0]?.id || "";
    const existingKeys = new Set(selectedTasks.map((t) => t.taskKey));
    const nextTemplate =
      STANDARD_WORKER_TASKS.find((tpl) => !existingKeys.has(tpl.key)) ||
      STANDARD_WORKER_TASKS[selectedTasks.length % STANDARD_WORKER_TASKS.length];

    setSelectedTasks((prev) => [
      ...prev,
      {
        stage: nextTemplate.stage,
        taskKey: nextTemplate.key,
        title: nextTemplate.title,
        assignedToId: defaultWorkerId,
        instructions: nextTemplate.defaultDescription,
      },
    ]);
  };

  const handleRemoveTaskDraft = (index: number) => {
    setSelectedTasks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateTaskDraft = (index: number, updates: Partial<TaskDraft>) => {
    setSelectedTasks((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, ...updates } : t))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTasks.length === 0) {
      setError("Please add at least one task to assign.");
      return;
    }

    const unassigned = selectedTasks.some((t) => !t.assignedToId);
    if (unassigned) {
      setError("Please select a worker (Mahesh or Ajay) for each task.");
      return;
    }

    const missingVendorTask = selectedTasks.find(
      (t) =>
        ["RESOURCE_FABRIC", "CUTTING", "STITCHING", "BRANDING_PRINTING"].includes(t.stage) &&
        !t.vendorId
    );
    if (missingVendorTask) {
      setError(
        `External vendor/partner selection is mandatory for "${missingVendorTask.title}" (${missingVendorTask.stage.replace(/_/g, " ")}). Please select a vendor.`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/ops/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          tasks: selectedTasks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to assign tasks.");
        setIsSubmitting(false);
        return;
      }

      onTaskAssigned();
      onClose();
    } catch (err: any) {
      setError("An unexpected error occurred while assigning task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white border border-[#E5E7EB] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#ECEEF2] flex items-center justify-between bg-[#F8F9FB] shrink-0 sticky top-0 z-10">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-[#111827] truncate">
                Assign Tasks — TT-{order.orderNumber}
              </h3>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Multi-Tasking
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">
              Assign tasks to workers with floor instructions
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Quick-Add Recommended Templates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#374151] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick-Add Task Templates:
              </span>
              <span className="text-[11px] text-[#6B7280]">
                Click template to add parallel task
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {STANDARD_WORKER_TASKS.map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => handleAddTaskDraft(tpl.stage, tpl.key, tpl.title, tpl.defaultDescription)}
                  className="px-3 py-1.5 rounded-xl bg-[#F4F6F9] hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-[#ECEEF2] text-[#374151] font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-[#00A86B]" />
                  <span>{tpl.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Task Drafts List */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-[#374151] uppercase tracking-wider flex items-center justify-between">
              <span>Tasks to Assign ({selectedTasks.length}):</span>
              {selectedTasks.length > 1 && (
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ⚡ Simultaneous Parallel Execution
                </span>
              )}
            </div>

            {selectedTasks.map((task, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3 relative group shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00A86B] text-white flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={task.title}
                      onChange={(e) => handleUpdateTaskDraft(idx, { title: e.target.value })}
                      placeholder="Task Title (e.g. Fabric Procurement)"
                      className="font-bold text-sm text-[#111827] bg-transparent border-b border-transparent focus:border-[#00A86B] outline-none px-1 py-0.5"
                    />
                  </div>

                  {selectedTasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTaskDraft(idx)}
                      className="text-red-500 hover:text-red-700 p-1 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Assign to Worker */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                      Assign to Worker<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={task.assignedToId}
                      onChange={(e) => handleUpdateTaskDraft(idx, { assignedToId: e.target.value })}
                      className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] focus:border-[#00A86B] outline-none"
                    >
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.employeeCode}) — {w.roleTitle}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stage Alignment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                      Related Stage
                    </label>
                    <select
                      value={task.stage}
                      onChange={(e) => handleUpdateTaskDraft(idx, { stage: e.target.value as OpsProductionStage })}
                      className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] focus:border-[#00A86B] outline-none"
                    >
                      {Object.keys(STAGE_DISPLAY_NAMES)
                        .filter((s) => s !== "NEW_ORDER" && s !== "ORDER_CONFIRMED")
                        .map((s) => (
                          <option key={s} value={s}>
                            {STAGE_DISPLAY_NAMES[s as OpsProductionStage]}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* External Partner Selection */}
                <div>
                  <VendorSelectDropdown
                    value={task.vendorId}
                    onChange={(vId, vendor) =>
                      handleUpdateTaskDraft(idx, {
                        vendorId: vId,
                        vendorName: vendor.name,
                      })
                    }
                    stage={task.stage}
                    label="External Vendor / Partner"
                    required={["RESOURCE_FABRIC", "CUTTING", "STITCHING", "BRANDING_PRINTING"].includes(task.stage)}
                    placeholder="Select external party (supplier, tailor, print partner)..."
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                    Instructions / Notes for Worker
                  </label>
                  <textarea
                    rows={2}
                    value={task.instructions}
                    onChange={(e) => handleUpdateTaskDraft(idx, { instructions: e.target.value })}
                    placeholder="e.g. Sourcing 40 pcs Interlock 240 GSM. Need embroidery thread in golden yellow."
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#111827] focus:border-[#00A86B] outline-none resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#ECEEF2] shrink-0">
            <button
              type="button"
              onClick={handleAddNextParallelTask}
              className="px-3.5 py-2 rounded-xl bg-[#F4F6F9] hover:bg-[#E5E7EB] text-[#374151] font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Add Another Parallel Task</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedTasks.length === 0}
                className="px-6 py-2 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Assigning Tasks...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Assign & Notify Worker(s)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
