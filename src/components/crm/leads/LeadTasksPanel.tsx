"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Plus, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { LEAD_TASK_TYPE_LABELS } from "@/types/crm";
import type { CrmLeadTask, CrmEmployee, LeadTaskType, LeadTaskPriority } from "@/types/crm";

interface Props {
  leadId: string;
  tasks: CrmLeadTask[];
  salesReps: CrmEmployee[];
  onChange: () => void;
}

const PRIORITY_STYLES: Record<LeadTaskPriority, string> = {
  LOW: "bg-[#F4F6F9] text-[#6B7280] border-[#E5E8ED]",
  NORMAL: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  HIGH: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  URGENT: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
};

const inputCls =
  "w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-xs text-[#111827] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none";

export const LeadTasksPanel: React.FC<Props> = ({ leadId, tasks, salesReps, onChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "FOLLOW_UP_CALL" as LeadTaskType,
    title: "",
    dueAt: "",
    priority: "NORMAL" as LeadTaskPriority,
    assignedToId: "",
  });
  const [submitting, setSubmitting] = useState(false);

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

  const completeTask = async (taskId: string) => {
    const notes = prompt("Completion notes (optional):") || undefined;
    const res = await fetch(`/api/crm/leads/${leadId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED", completionNotes: notes }),
    });
    if (!res.ok) {
      toast.error("Failed to complete task");
      return;
    }
    toast.success("Task marked complete");
    onChange();
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
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>{rep.name}</option>
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
              <button onClick={() => completeTask(task.id)} className="mt-0.5 text-[#D1D5DB] hover:text-[#10B981]">
                <Circle className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#111827]">{task.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
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
              <div key={task.id} className="flex items-start gap-3 p-3 opacity-60">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[#111827] line-through">{task.title}</span>
                  {task.completionNotes && <p className="text-xs text-[#9CA3AF] mt-0.5">{task.completionNotes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
