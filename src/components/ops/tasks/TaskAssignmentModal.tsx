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
}

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

  // Current stage subtasks as default
  const activeStage = order.opsStage || "RESOURCE_FABRIC";
  const defaultTemplates = STAGE_SUBTASKS[activeStage] || [];

  const [selectedTasks, setSelectedTasks] = useState<TaskDraft[]>([]);

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

          // Initialize first default task template
          const firstWorkerId = workerList[0]?.id || "";
          if (defaultTemplates.length > 0) {
            setSelectedTasks([
              {
                stage: activeStage,
                taskKey: defaultTemplates[0].key,
                title: defaultTemplates[0].title,
                assignedToId: firstWorkerId,
                instructions: defaultTemplates[0].defaultDescription,
              },
            ]);
          } else {
            setSelectedTasks([
              {
                stage: activeStage,
                taskKey: activeStage,
                title: STAGE_DISPLAY_NAMES[activeStage] || "Production Task",
                assignedToId: firstWorkerId,
                instructions: "",
              },
            ]);
          }
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
    setSelectedTasks((prev) => [
      ...prev,
      {
        stage,
        taskKey: templateKey || stage,
        title: title || STAGE_DISPLAY_NAMES[stage] || "Production Task",
        assignedToId: defaultWorkerId,
        instructions: desc || "",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ECEEF2] flex items-center justify-between bg-[#F8F9FB] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                Assign Tasks to Workers — TT-{order.orderNumber}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Parallel Multi-Tasking
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Assign single or simultaneous tasks to Mahesh or Ajay with specific floor instructions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] flex items-center justify-center"
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
              {[
                { stage: "RESOURCE_FABRIC" as const, key: "FABRIC_PROCUREMENT", label: "Fabric Procurement" },
                { stage: "RESOURCE_FABRIC" as const, key: "STITCHING", label: "Garment Stitching" },
                { stage: "BRANDING_PRINTING" as const, key: "PRINT_EMBROIDERY", label: "Print / Embroidery" },
                { stage: "PACKING" as const, key: "KAJE_BUTTON", label: "Kaje Button" },
                { stage: "PACKING" as const, key: "PRESSING_PACKING", label: "Press & Pack" },
                { stage: "DISPATCHED" as const, key: "DISPATCH", label: "Dispatch Run" },
              ].map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => handleAddTaskDraft(tpl.stage, tpl.key, tpl.label)}
                  className="px-3 py-1.5 rounded-xl bg-[#F4F6F9] hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-[#ECEEF2] text-[#374151] font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-[#00A86B]" />
                  <span>{tpl.label}</span>
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
                      {STAGE_SUBTASKS &&
                        Object.keys(STAGE_DISPLAY_NAMES).map((s) => (
                          <option key={s} value={s}>
                            {STAGE_DISPLAY_NAMES[s as OpsProductionStage]}
                          </option>
                        ))}
                    </select>
                  </div>
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
              onClick={() => handleAddTaskDraft(activeStage)}
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
