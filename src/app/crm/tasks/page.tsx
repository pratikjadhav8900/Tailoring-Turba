"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CrmLayout } from "@/components/crm/layout/CrmLayout";
import { LEAD_TASK_TYPE_LABELS } from "@/types/crm";
import type { CrmLeadTask, CrmEmployee } from "@/types/crm";
import toast from "react-hot-toast";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

const VIEWS = [
  { key: "today", label: "Today" },
  { key: "overdue", label: "Overdue" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all", label: "All Open" },
  { key: "completed", label: "Completed" },
];

const VIEW_KEYS = VIEWS.map((v) => v.key);

function CrmTasksContent() {
  const searchParams = useSearchParams();
  // The CRM dashboard links to /crm/tasks?view=overdue and ?view=today; this page used to
  // always render "Today" regardless, ignoring its own query param entirely.
  const requestedView = searchParams.get("view");
  const [view, setView] = useState(
    requestedView && VIEW_KEYS.includes(requestedView) ? requestedView : "today"
  );
  const [assignedToId, setAssignedToId] = useState("");
  const [tasks, setTasks] = useState<CrmLeadTask[]>([]);
  const [salesReps, setSalesReps] = useState<CrmEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view });
      if (assignedToId) params.set("assignedToId", assignedToId);
      const res = await fetch(`/api/crm/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [view, assignedToId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetch("/api/crm/employees")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSalesReps(d.employees || []));
  }, []);

  const completeTask = async (task: CrmLeadTask) => {
    const notes = prompt("Completion notes (optional):") || undefined;
    const res = await fetch(`/api/crm/leads/${task.leadId}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED", completionNotes: notes }),
    });
    if (!res.ok) {
      toast.error("Failed to complete task");
      return;
    }
    toast.success("Task completed");
    fetchTasks();
  };

  return (
    <CrmLayout pageTitle="Tasks & Follow-ups" pageSubtitle="Everything you need to action today">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 border-b border-[#ECEEF2]">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  view === v.key ? "border-[#FF6A39] text-[#111827]" : "border-transparent text-[#9CA3AF] hover:text-[#4B5563]"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="ml-auto bg-white border border-[#E5E8ED] rounded-xl px-3 py-2 text-xs text-[#111827] focus:border-[#FF6A39] outline-none"
          >
            <option value="">All sales reps</option>
            {salesReps.map((rep) => (
              <option key={rep.id} value={rep.id}>{rep.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-[#ECEEF2] rounded-2xl divide-y divide-[#F3F4F6]">
          {loading && <div className="text-center text-xs text-[#9CA3AF] py-8">Loading tasks...</div>}
          {!loading && tasks.length === 0 && <div className="text-center text-xs text-[#9CA3AF] py-8">No tasks here.</div>}
          {!loading &&
            tasks.map((task) => {
              const isOverdue = task.status !== "COMPLETED" && new Date(task.dueAt) < new Date();
              return (
                <div key={task.id} className="flex items-center gap-3 p-4">
                  {task.status === "COMPLETED" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  ) : (
                    <button onClick={() => completeTask(task)} className="w-4 h-4 rounded-full border-2 border-[#D1D5DB] hover:border-[#10B981] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold text-[#111827] ${task.status === "COMPLETED" ? "line-through opacity-60" : ""}`}>
                        {task.title}
                      </span>
                      <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">{LEAD_TASK_TYPE_LABELS[task.type]}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9CA3AF] flex-wrap">
                      {isOverdue ? <AlertCircle className="w-3 h-3 text-[#DC2626]" /> : <Clock className="w-3 h-3" />}
                      <span className={isOverdue ? "text-[#DC2626] font-semibold" : ""}>{new Date(task.dueAt).toLocaleString()}</span>
                      {task.lead && (
                        <>
                          <span>·</span>
                          <Link href={`/crm/leads/${task.lead.id}`} className="font-semibold text-[#FF6A39] hover:underline">
                            {task.lead.name}
                          </Link>
                        </>
                      )}
                      {task.assignedTo && <span>· {task.assignedTo.name}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </CrmLayout>
  );
}

export default function CrmTasksPage() {
  return (
    <Suspense fallback={null}>
      <CrmTasksContent />
    </Suspense>
  );
}
