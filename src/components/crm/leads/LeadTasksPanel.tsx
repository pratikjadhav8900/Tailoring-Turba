"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Plus, CheckCircle2, Circle, Clock, AlertCircle, FileText, ExternalLink } from "lucide-react";
import { LEAD_TASK_TYPE_LABELS } from "@/types/crm";
import type { CrmLeadTask, CrmEmployee, LeadTaskType, LeadTaskPriority } from "@/types/crm";
import { CompleteLeadTaskModal } from "@/components/shared/CompleteLeadTaskModal";

interface Props {
  leadId: string;
  tasks: CrmLeadTask[];
  /** Every active employee, not just Sales reps — a task (e.g. "Send Quotation") can be handed to another department. */
  assignableEmployees: CrmEmployee[];
  onChange: () => void;
}

function attachmentFileName(url: string): string {
  try {
    return new URL(url).pathname.split("/").pop() || "attachment";
  } catch {
    return "attachment";
  }
}

const PRIORITY_STYLES: Record<LeadTaskPriority, string> = {
  LOW: "bg-[#F4F6F9] text-[#6B7280] border-[#E5E8ED]",
  NORMAL: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  HIGH: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  URGENT: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
};

const inputCls =
  "w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none";

export const LeadTasksPanel: React.FC<Props> = ({ leadId, tasks, assignableEmployees, onChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "FOLLOW_UP_CALL" as LeadTaskType,
    title: "",
    dueAt: "",
    priority: "NORMAL" as LeadTaskPriority,
    assignedToId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [completingTask, setCompletingTask] = useState<CrmLeadTask | null>(null);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dueAt) {
      toast.error("Title and due date are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, assignedToId: form.assignedToId || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create task");
      toast.success("Task created");
      setForm({ type: "FOLLOW_UP_CALL", title: "", dueAt: "", priority: "NORMAL", assignedToId: "" });
      setShowForm(false);
      onChange();
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const pending = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");
  const completed = tasks.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#111827]">Tasks</h3>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#FF6A39] hover:text-[#E85A2A]"
        >
          <Plus className="w-3.5 h-3.5" />
          New Task
        </button>
      </div>

      {showForm && (
        <form onSubmit={createTask} className="mb-5 p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <select className={inputCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LeadTaskType }))}>
              {Object.entries(LEAD_TASK_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select className={inputCls} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as LeadTaskPriority }))}>
              {(["LOW", "NORMAL", "HIGH", "URGENT"] as LeadTaskPriority[]).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <input className={inputCls} placeholder="Task title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2.5">
            <input type="datetime-local" className={inputCls} value={form.dueAt} onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))} />
            <select className={inputCls} value={form.assignedToId} onChange={(e) => setForm((f) => ({ ...f, assignedToId: e.target.value }))}>
              <option value="">Assign to me</option>
              {assignableEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}{emp.department && emp.department.toUpperCase() !== "SALES" ? ` (${emp.department})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B7280]">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-1.5 rounded-lg bg-[#FF6A39] text-white text-xs font-semibold disabled:opacity-50">
              {submitting ? "Saving..." : "Create Task"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {pending.length === 0 && completed.length === 0 && (
          <div className="text-xs text-[#9CA3AF] text-center py-6">No tasks yet.</div>
        )}
        {pending.map((task) => {
          const isOverdue = new Date(task.dueAt) < new Date();
          return (
            <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-[#ECEEF2]">
              <button onClick={() => setCompletingTask(task)} className="mt-0.5 text-[#D1D5DB] hover:text-[#10B981]" title="Mark complete">
                <Circle className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#111827]">{task.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                  {task.type === "SEND_QUOTATION" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF1EB] text-[#FF6A39] border border-[#FFE1D1]">
                      {LEAD_TASK_TYPE_LABELS[task.type]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9CA3AF]">
                  {isOverdue ? <AlertCircle className="w-3 h-3 text-[#DC2626]" /> : <Clock className="w-3 h-3" />}
                  <span className={isOverdue ? "text-[#DC2626] font-semibold" : ""}>
                    Due {new Date(task.dueAt).toLocaleString()}
                  </span>
                  {task.assignedTo && <span>· {task.assignedTo.name}</span>}
                </div>
              </div>
            </div>
          );
        })}
        {completed.length > 0 && (
          <div className="pt-2">
            <div className="text-[11px] font-semibold text-[#9CA3AF] uppercase mb-1.5">Completed</div>
            {completed.map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-3 opacity-80">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[#111827] line-through">{task.title}</span>
                  {task.completionNotes && <p className="text-xs text-[#9CA3AF] mt-0.5">{task.completionNotes}</p>}
                  {task.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {task.attachments.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F8F9FB] border border-[#ECEEF2] text-[10px] font-semibold text-[#374151] hover:text-[#FF6A39] hover:border-[#FFD9C7] no-underline"
                        >
                          <FileText className="w-3 h-3" />
                          {attachmentFileName(url)}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {completingTask && (
        <CompleteLeadTaskModal
          isOpen
          onClose={() => setCompletingTask(null)}
          onSuccess={() => {
            toast.success("Task marked complete");
            onChange();
          }}
          taskId={completingTask.id}
          taskTitle={completingTask.title}
          taskType={completingTask.type}
          existingAttachments={completingTask.attachments}
          uploadEndpoint={`/api/crm/leads/${leadId}/tasks/${completingTask.id}/attachments`}
          patchEndpoint={`/api/crm/leads/${leadId}/tasks/${completingTask.id}`}
        />
      )}
    </div>
  );
};
