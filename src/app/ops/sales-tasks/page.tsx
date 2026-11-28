"use client";

import React, { useCallback, useEffect, useState } from "react";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { CompleteLeadTaskModal } from "@/components/shared/CompleteLeadTaskModal";
import type { SalesTaskItem } from "@/types/ops";
import toast from "react-hot-toast";
import {
  Check,
  Clock,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  RefreshCw,
  CheckCircle2,
  FileText,
  ExternalLink,
  Package,
  IndianRupee,
} from "lucide-react";

const TASK_TYPE_LABELS: Record<string, string> = {
  FOLLOW_UP_CALL: "Follow-up Call",
  SEND_QUOTATION: "Send Quotation",
  SEND_WHATSAPP: "Send WhatsApp Message",
  SEND_EMAIL: "Send Email",
  SCHEDULE_MEETING: "Schedule Meeting",
  REQUIREMENT_COLLECTION: "Requirement Collection",
  PRICE_NEGOTIATION: "Price Negotiation",
  SAMPLE_FOLLOW_UP: "Sample Follow-up",
  PAYMENT_FOLLOW_UP: "Payment Follow-up",
  ORDER_CONFIRMATION: "Order Confirmation",
  CUSTOM: "Custom Task",
};

function attachmentFileName(url: string): string {
  try {
    return new URL(url).pathname.split("/").pop() || "attachment";
  } catch {
    return "attachment";
  }
}

export default function SalesTasksPage() {
  const [tasks, setTasks] = useState<SalesTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"assigned" | "created">("assigned");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");
  const [currentEmployeeId, setCurrentEmployeeId] = useState("");
  const [completingTask, setCompletingTask] = useState<SalesTaskItem | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view, status: statusFilter });
      const res = await fetch(`/api/ops/sales-tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setCurrentEmployeeId(data.currentEmployeeId || "");
      }
    } catch (e) {
      console.error("Failed to load sales tasks", e);
    } finally {
      setLoading(false);
    }
  }, [view, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStart = async (task: SalesTaskItem) => {
    setStartingId(task.id);
    try {
      const res = await fetch(`/api/ops/sales-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update task");
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || "Failed to update task");
    } finally {
      setStartingId(null);
    }
  };

  return (
    <OpsLayout
      pageTitle="Sales Tasks"
      pageSubtitle="Quotations and other requests handed to you from the sales team"
      headerAction={
        <button
          type="button"
          onClick={fetchTasks}
          className="w-9 h-9 rounded-full bg-white border border-[#ECEEF2] text-[#4B5563] hover:text-[#111827] flex items-center justify-center shadow-xs transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="space-y-6 w-full max-w-5xl mx-auto">
        <div className="p-4 rounded-2xl bg-white border border-[#ECEEF2] flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F4F6F9] border border-[#ECEEF2]">
            <button
              type="button"
              onClick={() => setView("assigned")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === "assigned" ? "bg-white text-[#111827] shadow-xs" : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Assigned to Me
            </button>
            <button
              type="button"
              onClick={() => setView("created")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === "created" ? "bg-white text-[#111827] shadow-xs" : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Requested by Me
            </button>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: "ACTIVE", label: "Active" },
              { id: "COMPLETED", label: "Completed" },
              { id: "ALL", label: "All" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === s.id ? "bg-[#00A86B] text-white shadow-2xs" : "bg-white border border-[#ECEEF2] text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#9CA3AF]">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#ECEEF2] space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">Nothing here</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              {view === "assigned"
                ? "No sales tasks are currently assigned to you."
                : "You haven't handed off any tasks to another department yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => {
              const isDone = task.status === "COMPLETED";
              const isOverdue = !isDone && new Date(task.dueAt) < new Date();
              const isMine = task.assignedToId === currentEmployeeId;

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDone ? "bg-white/80 border-[#ECEEF2] opacity-80" : "bg-white border-[#ECEEF2] shadow-xs hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-[#F3F4F6]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span className="font-bold text-sm text-[#111827]">{task.lead.name}</span>
                      {task.lead.companyName && <span className="text-xs text-[#6B7280]">· {task.lead.companyName}</span>}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF1EB] text-[#FF6A39]">
                      {TASK_TYPE_LABELS[task.type] || task.type}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-[#111827]">{task.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDone ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {isDone ? "✓ Done" : task.status === "IN_PROGRESS" ? "In Progress" : "Pending"}
                      </span>
                    </div>
                    {task.description && <p className="text-xs text-[#6B7280]">{task.description}</p>}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#6B7280] mb-3 flex-wrap">
                    {task.lead.phone && (
                      <a href={`tel:${task.lead.phone}`} className="flex items-center gap-1 hover:text-[#FF6A39]">
                        <Phone className="w-3 h-3" />
                        {task.lead.phone}
                      </a>
                    )}
                    {task.lead.email && (
                      <a href={`mailto:${task.lead.email}`} className="flex items-center gap-1 hover:text-[#FF6A39]">
                        <Mail className="w-3 h-3" />
                        {task.lead.email}
                      </a>
                    )}
                    {task.lead.quantity != null && (
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {task.lead.quantity} pcs
                      </span>
                    )}
                    {task.lead.expectedValue != null && (
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {task.lead.expectedValue.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  {task.lead.requirements && (
                    <div className="p-3 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] text-xs text-[#374151] mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-0.5">Requirements</span>
                      <p className="leading-relaxed">{task.lead.requirements}</p>
                    </div>
                  )}

                  {isDone && task.completionNotes && (
                    <div className="text-[11px] text-[#4B5563] italic bg-[#F9FAFB] px-3 py-1.5 rounded-xl border border-[#ECEEF2] mb-3">
                      &ldquo;{task.completionNotes}&rdquo;
                    </div>
                  )}

                  {task.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {task.attachments.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F8F9FB] border border-[#ECEEF2] text-[10px] font-semibold text-[#374151] hover:text-[#00A86B] hover:border-emerald-200"
                        >
                          <FileText className="w-3 h-3" />
                          {attachmentFileName(url)}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#F3F4F6] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <span className="text-[10px] text-[#9CA3AF] flex items-center gap-1">
                      {isOverdue ? <AlertCircle className="w-3 h-3 text-[#DC2626]" /> : <Clock className="w-3 h-3" />}
                      <span className={isOverdue ? "text-[#DC2626] font-semibold" : ""}>
                        {isDone && task.completedAt
                          ? `Completed ${new Date(task.completedAt).toLocaleDateString("en-IN")}`
                          : `Due ${new Date(task.dueAt).toLocaleString("en-IN")}`}
                      </span>
                      {view === "assigned" && task.createdBy && <span>· from {task.createdBy.name}</span>}
                      {view === "created" && task.assignedTo && <span>· to {task.assignedTo.name}</span>}
                    </span>

                    {!isDone && isMine && (
                      <div className="flex items-center gap-2">
                        {task.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => handleStart(task)}
                            disabled={startingId === task.id}
                            className="px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#374151] disabled:opacity-50"
                          >
                            {startingId === task.id ? "Starting..." : "Start"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setCompletingTask(task)}
                          className="px-5 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Mark Done</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {completingTask && (
        <CompleteLeadTaskModal
          isOpen
          onClose={() => setCompletingTask(null)}
          onSuccess={() => {
            toast.success("Task marked complete");
            fetchTasks();
          }}
          taskId={completingTask.id}
          taskTitle={completingTask.title}
          taskType={completingTask.type}
          existingAttachments={completingTask.attachments}
          uploadEndpoint={`/api/ops/sales-tasks/${completingTask.id}/attachments`}
          patchEndpoint={`/api/ops/sales-tasks/${completingTask.id}`}
        />
      )}
    </OpsLayout>
  );
}
